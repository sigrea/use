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

import {
	createWatchSnapshotBaseline,
	hasWatchSnapshotChanged,
	resolveWatchSnapshotDepth,
} from "../internal/watchSnapshot";
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
	const snapshotDepth = resolveWatchSnapshotDepth(deep);
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

	let mountBaselineLeft = createWatchSnapshotBaseline(
		leftSignal.peek(),
		snapshotDepth,
	);
	let mountBaselineRight = createWatchSnapshotBaseline(
		rightSignal.peek(),
		snapshotDepth,
	);
	const refreshMountBaseline = () => {
		mountBaselineLeft = createWatchSnapshotBaseline(
			leftSignal.peek(),
			snapshotDepth,
		);
		mountBaselineRight = createWatchSnapshotBaseline(
			rightSignal.peek(),
			snapshotDepth,
		);
	};

	const syncChangedValueOnMount = () => {
		if (stopped) {
			return;
		}

		const leftChanged = hasWatchSnapshotChanged(
			leftSignal.peek(),
			mountBaselineLeft,
			snapshotDepth,
		);
		const rightChanged = hasWatchSnapshotChanged(
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
