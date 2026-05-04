import {
	getCurrentScope,
	isComputed,
	isSignal,
	onDispose,
	onMount,
	watch,
} from "@sigrea/core";
import type {
	Computed,
	Signal,
	WatchOptions,
	WatchStopHandle,
} from "@sigrea/core";

import type {
	SyncSignalDirection,
	SyncSignalOptions,
	SyncSignalReturn,
	SyncSignalTransform,
} from "../types";

type IfEquals<X, Y, Then, Else> = (<T>() => T extends X ? 1 : 2) extends <
	T,
>() => T extends Y ? 1 : 2
	? Then
	: Else;

type Equal<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

type IsReadonlyValue<T> = T extends { value: unknown }
	? IfEquals<
			{ [K in "value"]: T[K] },
			{ -readonly [K in "value"]: T[K] },
			false,
			true
		>
	: true;

type WritableSignalSource<TSource> = TSource extends Computed<unknown>
	? never
	: TSource extends Signal<unknown>
		? IsReadonlyValue<TSource> extends true
			? never
			: unknown
		: never;

type SignalValue<TSource> = TSource extends Signal<infer Value> ? Value : never;

type SyncSignalOptionsArg<L, R, D extends SyncSignalDirection> = Equal<
	L,
	R
> extends true
	? [options?: SyncSignalOptions<L, R, D>]
	: [options: SyncSignalOptions<L, R, D>];

interface MountBaseline<T> {
	value: T;
	snapshot: unknown;
}

const SNAPSHOT_ID = Symbol("syncSignal.snapshotId");
const ARRAY_HOLE = Symbol("syncSignal.arrayHole");
const SIGNAL_SKIP = "__v_skip";
const snapshotIds = new WeakMap<object, number>();
let nextSnapshotId = 0;

function getValueDescriptor(source: object): PropertyDescriptor | undefined {
	let current: object | null = source;

	while (current !== null) {
		const descriptor = Object.getOwnPropertyDescriptor(current, "value");
		if (descriptor !== undefined) {
			return descriptor;
		}

		current = Object.getPrototypeOf(current);
	}
}

function isWritableSignalSource(source: unknown): source is Signal<unknown> {
	return (
		typeof source === "object" &&
		source !== null &&
		isSignal(source) &&
		!isComputed(source) &&
		typeof getValueDescriptor(source)?.set === "function"
	);
}

function isObject(value: unknown): value is object {
	return typeof value === "object" && value !== null;
}

function isPlainObject(value: object): boolean {
	return Object.prototype.toString.call(value) === "[object Object]";
}

function isRawObject(value: object): boolean {
	return Boolean((value as Record<string, unknown>)[SIGNAL_SKIP]);
}

function resolveSnapshotDepth(deep: WatchOptions["deep"]): number {
	if (deep === true) {
		return Number.POSITIVE_INFINITY;
	}
	if (typeof deep === "number") {
		if (!Number.isFinite(deep)) {
			return Number.POSITIVE_INFINITY;
		}
		return deep <= 0 ? 1 : deep + 1;
	}
	return 0;
}

function getSnapshotId(value: object): number {
	const currentId = snapshotIds.get(value);
	if (currentId !== undefined) {
		return currentId;
	}

	const nextId = nextSnapshotId;
	nextSnapshotId += 1;
	snapshotIds.set(value, nextId);
	return nextId;
}

function assignSnapshotId<T extends object>(snapshot: T, source: object): T {
	(snapshot as Record<PropertyKey, unknown>)[SNAPSHOT_ID] =
		getSnapshotId(source);
	return snapshot;
}

function createSnapshot(
	value: unknown,
	depth: number,
	seen?: WeakMap<object, unknown>,
): unknown {
	if (depth <= 0 || !isObject(value)) {
		return value;
	}

	if (isRawObject(value)) {
		return assignSnapshotId({ type: "Raw" }, value);
	}

	const nextSeen = seen ?? new WeakMap<object, unknown>();
	const cached = nextSeen.get(value);
	if (cached !== undefined) {
		return cached;
	}

	const nextDepth = depth - 1;
	if (isSignal(value)) {
		const output = assignSnapshotId(
			{ type: "Signal", value: undefined as unknown },
			value,
		);
		nextSeen.set(value, output);
		output.value = createSnapshot(
			(value as Signal<unknown>).value,
			nextDepth,
			nextSeen,
		);
		return output;
	}
	if (Array.isArray(value)) {
		const output: unknown[] = assignSnapshotId(new Array(value.length), value);
		nextSeen.set(value, output);
		for (let index = 0; index < value.length; index += 1) {
			output[index] = Object.prototype.hasOwnProperty.call(value, index)
				? createSnapshot(value[index], nextDepth, nextSeen)
				: ARRAY_HOLE;
		}
		return output;
	}
	if (value instanceof Set) {
		const output = assignSnapshotId(
			{ type: "Set", values: [] as unknown[] },
			value,
		);
		nextSeen.set(value, output);
		for (const entry of value) {
			output.values.push(createSnapshot(entry, nextDepth, nextSeen));
		}
		return output;
	}
	if (value instanceof Map) {
		const output = assignSnapshotId(
			{ entries: [] as unknown[][], type: "Map" },
			value,
		);
		nextSeen.set(value, output);
		for (const [key, entry] of value) {
			output.entries.push([
				createSnapshot(key, nextDepth, nextSeen),
				createSnapshot(entry, nextDepth, nextSeen),
			]);
		}
		return output;
	}
	if (!isPlainObject(value)) {
		return assignSnapshotId({ type: "Object" }, value);
	}

	const output = assignSnapshotId({} as Record<PropertyKey, unknown>, value);
	nextSeen.set(value, output);
	const objectValue = value as Record<PropertyKey, unknown>;
	for (const key of Object.keys(objectValue)) {
		output[key] = createSnapshot(objectValue[key], nextDepth, nextSeen);
	}
	for (const key of Object.getOwnPropertySymbols(objectValue)) {
		if (Object.prototype.propertyIsEnumerable.call(objectValue, key)) {
			output[key] = createSnapshot(objectValue[key], nextDepth, nextSeen);
		}
	}
	return output;
}

function areSnapshotsEqual(
	left: unknown,
	right: unknown,
	seen?: WeakMap<object, WeakSet<object>>,
): boolean {
	if (Object.is(left, right)) {
		return true;
	}
	if (!isObject(left) || !isObject(right)) {
		return false;
	}

	const nextSeen = seen ?? new WeakMap<object, WeakSet<object>>();
	const seenRights = nextSeen.get(left);
	if (seenRights?.has(right)) {
		return true;
	}
	if (seenRights === undefined) {
		nextSeen.set(left, new WeakSet([right]));
	} else {
		seenRights.add(right);
	}

	const leftKeys = Reflect.ownKeys(left);
	const rightKeys = Reflect.ownKeys(right);
	if (leftKeys.length !== rightKeys.length) {
		return false;
	}

	const rightKeySet = new Set(rightKeys);
	for (const key of leftKeys) {
		if (!rightKeySet.has(key)) {
			return false;
		}
		if (
			!areSnapshotsEqual(
				(left as Record<PropertyKey, unknown>)[key],
				(right as Record<PropertyKey, unknown>)[key],
				nextSeen,
			)
		) {
			return false;
		}
	}

	return true;
}

function createMountBaseline<T>(
	value: T,
	snapshotDepth: number,
): MountBaseline<T> {
	return {
		snapshot: createSnapshot(value, snapshotDepth),
		value,
	};
}

function hasBaselineChanged<T>(
	value: T,
	baseline: MountBaseline<T>,
	snapshotDepth: number,
): boolean {
	if (!Object.is(value, baseline.value)) {
		return true;
	}
	if (snapshotDepth <= 0) {
		return false;
	}
	return !areSnapshotsEqual(
		createSnapshot(value, snapshotDepth),
		baseline.snapshot,
	);
}

export function syncSignal<
	const TLeft,
	const TRight,
	D extends SyncSignalDirection = "both",
>(
	left: TLeft & WritableSignalSource<TLeft>,
	right: TRight & WritableSignalSource<TRight>,
	...[options]: SyncSignalOptionsArg<SignalValue<TLeft>, SignalValue<TRight>, D>
): SyncSignalReturn {
	type L = SignalValue<TLeft>;
	type R = SignalValue<TRight>;

	if (!isWritableSignalSource(left) || !isWritableSignalSource(right)) {
		throw new TypeError("syncSignal sources must be writable signals.");
	}

	const leftSignal = left as Signal<L>;
	const rightSignal = right as Signal<R>;
	const {
		deep = false,
		direction = "both",
		flush = "sync",
		immediate = true,
	} = options ?? {};
	const transform =
		(options as { transform?: Partial<SyncSignalTransform<L, R>> } | undefined)
			?.transform ?? {};
	const transformLTR = transform.ltr ?? ((value: L) => value as unknown as R);
	const transformRTL = transform.rtl ?? ((value: R) => value as unknown as L);
	const watchOptions: WatchOptions = { deep, flush };
	const snapshotDepth = resolveSnapshotDepth(deep);
	const stops: WatchStopHandle[] = [];
	let ignoredLeft: L | undefined;
	let ignoredRight: R | undefined;
	let hasIgnoredLeft = false;
	let hasIgnoredRight = false;
	let stopped = false;

	const takeIgnoredLeft = (value: L) => {
		if (!hasIgnoredLeft) {
			return false;
		}

		const shouldIgnore = Object.is(value, ignoredLeft);
		hasIgnoredLeft = false;
		ignoredLeft = undefined;
		return shouldIgnore;
	};

	const takeIgnoredRight = (value: R) => {
		if (!hasIgnoredRight) {
			return false;
		}

		const shouldIgnore = Object.is(value, ignoredRight);
		hasIgnoredRight = false;
		ignoredRight = undefined;
		return shouldIgnore;
	};

	const writeLeft = (value: L) => {
		if (!Object.is(leftSignal.peek(), value)) {
			ignoredLeft = value;
			hasIgnoredLeft = true;
		}
		leftSignal.value = value;
	};

	const writeRight = (value: R) => {
		if (!Object.is(rightSignal.peek(), value)) {
			ignoredRight = value;
			hasIgnoredRight = true;
		}
		rightSignal.value = value;
	};

	const syncInitial = (trackIgnoredWrites: boolean) => {
		const setRight = trackIgnoredWrites
			? writeRight
			: (value: R) => {
					rightSignal.value = value;
				};
		const setLeft = trackIgnoredWrites
			? writeLeft
			: (value: L) => {
					leftSignal.value = value;
				};

		if (direction === "both" || direction === "ltr") {
			setRight(transformLTR(leftSignal.value));
		}
		if (direction === "both" || direction === "rtl") {
			setLeft(transformRTL(rightSignal.value));
		}
	};

	let mountBaselineLeft = createMountBaseline(leftSignal.peek(), snapshotDepth);
	let mountBaselineRight = createMountBaseline(
		rightSignal.peek(),
		snapshotDepth,
	);
	const refreshMountBaseline = () => {
		mountBaselineLeft = createMountBaseline(leftSignal.peek(), snapshotDepth);
		mountBaselineRight = createMountBaseline(rightSignal.peek(), snapshotDepth);
	};

	const syncChangedValueOnMount = () => {
		if (stopped) {
			return;
		}

		const leftChanged = hasBaselineChanged(
			leftSignal.peek(),
			mountBaselineLeft,
			snapshotDepth,
		);
		const rightChanged = hasBaselineChanged(
			rightSignal.peek(),
			mountBaselineRight,
			snapshotDepth,
		);
		if (!leftChanged && !rightChanged) {
			refreshMountBaseline();
			return;
		}

		if (direction === "ltr") {
			if (leftChanged) {
				writeRight(transformLTR(leftSignal.value));
			}
			refreshMountBaseline();
			return;
		}
		if (direction === "rtl") {
			if (rightChanged) {
				writeLeft(transformRTL(rightSignal.value));
			}
			refreshMountBaseline();
			return;
		}
		if (leftChanged && !rightChanged) {
			writeRight(transformLTR(leftSignal.value));
			refreshMountBaseline();
			return;
		}
		if (rightChanged && !leftChanged) {
			writeLeft(transformRTL(rightSignal.value));
			refreshMountBaseline();
			return;
		}

		writeLeft(transformRTL(rightSignal.value));
		refreshMountBaseline();
	};

	if (immediate) {
		syncInitial(false);
		refreshMountBaseline();
	}

	if (direction === "both" || direction === "ltr") {
		stops.push(
			watch(
				leftSignal,
				(nextValue) => {
					if (stopped || takeIgnoredLeft(nextValue)) {
						return;
					}

					writeRight(transformLTR(nextValue));
					refreshMountBaseline();
				},
				watchOptions,
			),
		);
	}

	if (direction === "both" || direction === "rtl") {
		stops.push(
			watch(
				rightSignal,
				(nextValue) => {
					if (stopped || takeIgnoredRight(nextValue)) {
						return;
					}

					writeLeft(transformRTL(nextValue));
					refreshMountBaseline();
				},
				watchOptions,
			),
		);
	}

	try {
		onMount(syncChangedValueOnMount);
	} catch {}

	const stop = () => {
		if (stopped) {
			return;
		}

		stopped = true;
		hasIgnoredLeft = false;
		hasIgnoredRight = false;
		ignoredLeft = undefined;
		ignoredRight = undefined;
		for (const stopWatching of stops) {
			stopWatching();
		}
		stops.length = 0;
	};

	const scope = getCurrentScope();
	if (scope !== undefined) {
		onDispose(stop, scope);
	}

	return stop;
}
