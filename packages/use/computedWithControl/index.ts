import {
	computed,
	getCurrentScope,
	isDeepSignal,
	isSignal,
	onDispose,
	onMount,
	signal,
	untracked,
	watch,
} from "@sigrea/core";
import type { WatchOptions } from "@sigrea/core";

import type {
	ComputedWithControlGetter,
	ComputedWithControlOptions,
	ComputedWithControlRef,
	ComputedWithControlReturn,
	ComputedWithControlSource,
	ComputedWithControlSourceList,
	WritableComputedWithControlOptions,
	WritableComputedWithControlReturn,
} from "../types";

type WatchSourceInput =
	| ComputedWithControlSource
	| ComputedWithControlSourceList;

type WatchWithControl = (
	source: WatchSourceInput,
	callback: () => void,
	options: WatchOptions,
) => () => void;

const SNAPSHOT_BRAND = Symbol("sigrea.use.computedWithControl.snapshot");
const NO_SNAPSHOT_IDENTITY = Symbol(
	"sigrea.use.computedWithControl.snapshot.identityless",
);

interface SnapshotContainer {
	readonly [SNAPSHOT_BRAND]: true;
	readonly identity: unknown;
	readonly entries: readonly unknown[];
}

function isObject(value: unknown): value is object {
	return (
		(typeof value === "object" && value !== null) || typeof value === "function"
	);
}

function snapshot(
	entries: readonly unknown[],
	identity: unknown = NO_SNAPSHOT_IDENTITY,
): SnapshotContainer {
	return { [SNAPSHOT_BRAND]: true, identity, entries };
}

function isSnapshotContainer(value: unknown): value is SnapshotContainer {
	return (
		isObject(value) && (value as SnapshotContainer)[SNAPSHOT_BRAND] === true
	);
}

function createSnapshot(
	value: unknown,
	depth: number,
	seen = new Set<unknown>(),
): unknown {
	if (depth <= 0 || !isObject(value) || seen.has(value)) {
		return value;
	}

	seen.add(value);
	const nextDepth = depth - 1;

	if (isSignal(value)) {
		return createSnapshot(value.value, nextDepth, seen);
	}
	if (Array.isArray(value)) {
		return snapshot(
			value.map((entry) => createSnapshot(entry, nextDepth, seen)),
			value,
		);
	}
	if (value instanceof Map) {
		return snapshot(
			Array.from(value, ([key, entry]) =>
				snapshot([
					createSnapshot(key, nextDepth, seen),
					createSnapshot(entry, nextDepth, seen),
				]),
			),
			value,
		);
	}
	if (value instanceof Set) {
		return snapshot(
			Array.from(value, (entry) => createSnapshot(entry, nextDepth, seen)),
			value,
		);
	}

	const keys = Reflect.ownKeys(value).filter((key) =>
		Object.prototype.propertyIsEnumerable.call(value, key),
	);
	return snapshot(
		keys.map((key) =>
			snapshot([
				key,
				createSnapshot(
					(value as Record<PropertyKey, unknown>)[key],
					nextDepth,
					seen,
				),
			]),
		),
		value,
	);
}

function trackSource(
	value: unknown,
	depth: number,
	seen = new Set<unknown>(),
): void {
	if (depth <= 0 || !isObject(value) || seen.has(value)) {
		return;
	}

	seen.add(value);
	const nextDepth = depth - 1;

	if (isSignal(value)) {
		trackSource(value.value, nextDepth, seen);
		return;
	}
	if (Array.isArray(value)) {
		for (const entry of value) {
			trackSource(entry, nextDepth, seen);
		}
		return;
	}
	if (value instanceof Map) {
		for (const [key, entry] of value) {
			trackSource(key, nextDepth, seen);
			trackSource(entry, nextDepth, seen);
		}
		return;
	}
	if (value instanceof Set) {
		for (const entry of value) {
			trackSource(entry, nextDepth, seen);
		}
		return;
	}

	for (const key of Reflect.ownKeys(value)) {
		if (Object.prototype.propertyIsEnumerable.call(value, key)) {
			trackSource(
				(value as Record<PropertyKey, unknown>)[key],
				nextDepth,
				seen,
			);
		}
	}
}

function resolveDepth(
	deep: ComputedWithControlOptions["deep"],
	shallowDeepSignal: boolean,
): number {
	if (deep === true) {
		return Number.POSITIVE_INFINITY;
	}
	if (typeof deep === "number") {
		if (!Number.isFinite(deep)) {
			return Number.POSITIVE_INFINITY;
		}
		return deep <= 0 ? 0 : deep + 1;
	}
	return shallowDeepSignal ? 1 : 0;
}

function readSourceEntry(
	source: ComputedWithControlSource,
	deep: ComputedWithControlOptions["deep"],
): unknown {
	if (isSignal(source)) {
		const value = source.value;
		const depth = resolveDepth(deep, false);
		trackSource(value, depth);
		return createSnapshot(value, depth);
	}
	if (isDeepSignal(source)) {
		const depth = resolveDepth(deep, true);
		trackSource(source, depth);
		return createSnapshot(source, depth);
	}
	if (typeof source === "function") {
		const value = (source as () => unknown)();
		const depth = resolveDepth(deep, false);
		trackSource(value, depth);
		return createSnapshot(value, depth);
	}
	return source;
}

function isEqualSnapshot(value: unknown, oldValue: unknown): boolean {
	if (Object.is(value, oldValue)) {
		return true;
	}
	if (isSnapshotContainer(value) || isSnapshotContainer(oldValue)) {
		if (!isSnapshotContainer(value) || !isSnapshotContainer(oldValue)) {
			return false;
		}
		if (
			(value.identity !== NO_SNAPSHOT_IDENTITY ||
				oldValue.identity !== NO_SNAPSHOT_IDENTITY) &&
			!Object.is(value.identity, oldValue.identity)
		) {
			return false;
		}
		return hasArrayChanged(value.entries, oldValue.entries) === false;
	}
	return false;
}

function hasChanged(value: unknown, oldValue: unknown): boolean {
	return !isEqualSnapshot(value, oldValue);
}

function hasArrayChanged(
	value: readonly unknown[],
	oldValue: unknown,
): boolean {
	if (!Array.isArray(oldValue)) {
		return true;
	}
	if (value.length !== oldValue.length) {
		return true;
	}
	return value.some((entry, index) => hasChanged(entry, oldValue[index]));
}

function readSource(
	source: WatchSourceInput,
	deep: ComputedWithControlOptions["deep"],
): unknown {
	if (Array.isArray(source) && !isDeepSignal(source)) {
		return snapshot(
			(source as ComputedWithControlSourceList).map((entry) =>
				readSourceEntry(entry, deep),
			),
		);
	}
	return readSourceEntry(source, deep);
}

export function computedWithControl<T>(
	source: WatchSourceInput,
	fn: ComputedWithControlGetter<T>,
	options?: ComputedWithControlOptions,
): ComputedWithControlReturn<T>;
export function computedWithControl<T>(
	source: WatchSourceInput,
	fn: WritableComputedWithControlOptions<T>,
	options?: ComputedWithControlOptions,
): WritableComputedWithControlReturn<T>;
export function computedWithControl<T>(
	source: WatchSourceInput,
	fn: ComputedWithControlGetter<T> | WritableComputedWithControlOptions<T>,
	options: ComputedWithControlOptions = {},
): ComputedWithControlRef<T> {
	const watchOptions: WatchOptions = {
		...options,
		deep: options.deep ?? false,
		flush: options.flush ?? "sync",
	};
	const version = signal(0);
	const sourceSnapshot = computed(() => {
		return readSource(source, watchOptions.deep);
	});
	let lastSourceSnapshot = sourceSnapshot.value;
	let dirty = true;
	let waitingForMount = false;
	let value: T | undefined;

	const get = typeof fn === "function" ? fn : fn.get;
	const set = typeof fn === "function" ? undefined : fn.set;

	const markDirty = () => {
		dirty = true;
		version.value += 1;
	};

	const refreshDirtyFromSource = () => {
		const nextSourceSnapshot = sourceSnapshot.value;
		const changed = hasChanged(nextSourceSnapshot, lastSourceSnapshot);
		if (changed) {
			lastSourceSnapshot = nextSourceSnapshot;
			dirty = true;
		}
	};

	const readValue = () => {
		version.value;
		if (watchOptions.flush === "sync" || waitingForMount) {
			refreshDirtyFromSource();
		}
		if (dirty) {
			value = untracked(() => get(value));
			dirty = false;
		}
		return value as T;
	};

	const stop = (watch as WatchWithControl)(source, markDirty, watchOptions);
	const scope = getCurrentScope();
	if (scope !== undefined) {
		onDispose(stop, scope);
	}
	try {
		waitingForMount = true;
		onMount(() => {
			waitingForMount = false;
			refreshDirtyFromSource();
		});
	} catch {
		waitingForMount = false;
	}

	if (set === undefined) {
		return Object.assign(computed(readValue), {
			trigger: markDirty,
		}) as ComputedWithControlReturn<T>;
	}

	return Object.assign(
		computed({
			get: readValue,
			set,
		}),
		{ trigger: markDirty },
	) as WritableComputedWithControlReturn<T>;
}
