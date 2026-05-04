import {
	getCurrentScope,
	isComputed,
	isDeepSignal,
	isSignal,
	onDispose,
	onMount,
	watch,
} from "@sigrea/core";
import type {
	Computed,
	DeepSignal,
	ReadonlyDeepSignal,
	ReadonlySignal,
	Signal,
	WatchOptions,
	WatchSource,
	WatchStopHandle,
} from "@sigrea/core";

import {
	createWatchSnapshotBaseline,
	hasWatchSnapshotChanged,
	resolveWatchSnapshotDepth,
} from "../internal/watchSnapshot";
import type { SyncSignalsOptions, SyncSignalsReturn } from "../types";

type IfEquals<X, Y, Then, Else> = (<T>() => T extends X ? 1 : 2) extends <
	T,
>() => T extends Y ? 1 : 2
	? Then
	: Else;

type IsReadonlyValue<T> = T extends { value: unknown }
	? IfEquals<
			{ [K in "value"]: T[K] },
			{ -readonly [K in "value"]: T[K] },
			false,
			true
		>
	: true;

type SignalTargetValue<TTarget> = TTarget extends Signal<infer Value>
	? Value
	: never;

type WritableSignalTarget<TTarget> = TTarget extends Computed<unknown>
	? never
	: TTarget extends Signal<unknown>
		? IsReadonlyValue<TTarget> extends true
			? never
			: unknown
		: never;

type AssignableSignalTarget<TValue, TTarget> = [TValue] extends [
	SignalTargetValue<TTarget>,
]
	? unknown
	: never;

type SyncSignalsTargetListArg<TValue, TTargets extends readonly unknown[]> = {
	readonly [K in keyof TTargets]: TTargets[K] &
		WritableSignalTarget<TTargets[K]> &
		AssignableSignalTarget<TValue, TTargets[K]>;
};

type SyncSignalsSource<TValue> = WatchSource<TValue>;

type WatchSourceValue<TSource> = TSource extends Signal<infer Value>
	? Value
	: TSource extends ReadonlySignal<infer Value>
		? Value
		: TSource extends Computed<infer Value>
			? Value
			: TSource extends () => infer Value
				? Value
				: TSource extends DeepSignal<infer Value>
					? Value
					: TSource extends ReadonlyDeepSignal<infer Value>
						? Value
						: never;

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

function isWritableSignalTarget(source: unknown): source is Signal<unknown> {
	return (
		typeof source === "object" &&
		source !== null &&
		isSignal(source) &&
		!isComputed(source) &&
		typeof getValueDescriptor(source)?.set === "function"
	);
}

function toTargetArray<TValue>(targets: unknown): Signal<TValue>[] {
	const targetArray = Array.isArray(targets) ? Array.from(targets) : [targets];

	if (!targetArray.every(isWritableSignalTarget)) {
		throw new TypeError("syncSignals targets must be writable signals.");
	}

	return targetArray as Signal<TValue>[];
}

function isSyncSignalsSource(source: unknown): source is WatchSource<unknown> {
	return (
		typeof source === "function" || isSignal(source) || isDeepSignal(source)
	);
}

function readSourceValue<TValue>(source: WatchSource<TValue>): TValue {
	if (typeof source === "function") {
		return (source as () => TValue)();
	}
	if (isSignal(source)) {
		return (source as Signal<TValue>).value;
	}
	return source as TValue;
}

function resolveSourceSnapshotDepth(
	source: WatchSource<unknown>,
	deep: WatchOptions["deep"],
): number {
	if (deep === false && isDeepSignal(source)) {
		return 1;
	}
	return resolveWatchSnapshotDepth(deep);
}

/**
 * Keep writable target signals in sync with one source.
 *
 * @param source source watched by @sigrea/core
 * @param targets writable target signal or signals
 */
export function syncSignals<const TSource, const TTarget>(
	source: TSource & SyncSignalsSource<WatchSourceValue<TSource>>,
	target: TTarget &
		WritableSignalTarget<TTarget> &
		AssignableSignalTarget<WatchSourceValue<TSource>, TTarget>,
	options?: SyncSignalsOptions,
): SyncSignalsReturn;
export function syncSignals<
	const TSource,
	const TTargets extends readonly unknown[],
>(
	source: TSource & SyncSignalsSource<WatchSourceValue<TSource>>,
	targets: readonly [...TTargets] &
		SyncSignalsTargetListArg<WatchSourceValue<TSource>, TTargets>,
	options?: SyncSignalsOptions,
): SyncSignalsReturn;
export function syncSignals(
	source: unknown,
	targets: unknown,
	options: SyncSignalsOptions = {},
): SyncSignalsReturn {
	type Value = unknown;

	if (!isSyncSignalsSource(source)) {
		throw new TypeError("syncSignals source must be a watch source.");
	}

	const targetSignals = toTargetArray<Value>(targets);
	const { deep = false, flush = "sync", immediate = true } = options;
	const watchOptions: WatchOptions = { deep, flush, immediate: false };
	const sourceValue = () => readSourceValue(source);
	const snapshotDepth = resolveSourceSnapshotDepth(source, deep);
	let sourceBaseline = createWatchSnapshotBaseline(
		sourceValue(),
		snapshotDepth,
	);
	let stopped = false;

	const writeTargets = (value: Value) => {
		for (const target of targetSignals) {
			target.value = value;
		}
	};
	const refreshSourceBaseline = () => {
		sourceBaseline = createWatchSnapshotBaseline(sourceValue(), snapshotDepth);
	};
	const syncChangedValueOnMount = () => {
		if (stopped) {
			return;
		}

		const nextValue = sourceValue();
		if (hasWatchSnapshotChanged(nextValue, sourceBaseline, snapshotDepth)) {
			writeTargets(nextValue);
		}
		refreshSourceBaseline();
	};

	if (immediate) {
		writeTargets(sourceValue());
		refreshSourceBaseline();
	}

	const stopWatching: WatchStopHandle = watch(
		source,
		(nextValue) => {
			if (stopped) {
				return;
			}

			writeTargets(nextValue);
			refreshSourceBaseline();
		},
		watchOptions,
	);

	try {
		onMount(syncChangedValueOnMount);
	} catch {}

	const stop = () => {
		if (stopped) {
			return;
		}

		stopped = true;
		stopWatching();
	};

	const scope = getCurrentScope();
	if (scope !== undefined) {
		onDispose(stop, scope);
	}

	return stop;
}
