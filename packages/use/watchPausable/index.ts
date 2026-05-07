import { isDeepSignal, readonly, signal, watch } from "@sigrea/core";
import type {
	DeepSignal,
	ReadonlyDeepSignal,
	WatchOptions,
	WatchSource,
	WatchStopHandle,
} from "@sigrea/core";

import type {
	WatchPausableCallback,
	WatchPausableOptions,
	WatchPausableReturn,
	WatchPausableSourceValue,
	WatchPausableSourceValues,
} from "../types";

type AnyWatchPausableSource =
	| WatchSource<unknown>
	| DeepSignal<object>
	| ReadonlyDeepSignal<object>;
type WatchPausableSourceList = readonly AnyWatchPausableSource[];
type WatchPausableInput = AnyWatchPausableSource | WatchPausableSourceList;
type InternalWatchPausableCallback = WatchPausableCallback<unknown, unknown>;
type ImplementationWatchCallback = (...args: never[]) => unknown;

function isSourceList(
	source: WatchPausableInput,
): source is WatchPausableSourceList {
	return Array.isArray(source) && !isDeepSignal(source);
}

function watchSource(
	source: WatchPausableInput,
	callback: InternalWatchPausableCallback,
	options: WatchOptions,
): WatchStopHandle {
	return isSourceList(source)
		? watch(source as readonly WatchSource<unknown>[], callback, options)
		: watch(source as WatchSource<unknown>, callback, options);
}

/**
 * Watch a source with pause and resume controls.
 */
export function watchPausable<
	TSources extends readonly AnyWatchPausableSource[],
>(
	source: readonly [...TSources],
	callback: WatchPausableCallback<
		WatchPausableSourceValues<TSources>,
		WatchPausableSourceValues<TSources>
	>,
	options?: WatchPausableOptions<false>,
): WatchPausableReturn;
export function watchPausable<
	TSources extends readonly AnyWatchPausableSource[],
	Immediate extends boolean = false,
>(
	source: readonly [...TSources],
	callback: WatchPausableCallback<
		WatchPausableSourceValues<TSources>,
		Immediate extends true
			? WatchPausableSourceValues<TSources> | []
			: WatchPausableSourceValues<TSources>
	>,
	options?: WatchPausableOptions<Immediate>,
): WatchPausableReturn;
export function watchPausable<TSource extends AnyWatchPausableSource>(
	source: TSource,
	callback: WatchPausableCallback<
		WatchPausableSourceValue<TSource>,
		WatchPausableSourceValue<TSource>
	>,
	options?: WatchPausableOptions<false>,
): WatchPausableReturn;
export function watchPausable<
	TSource extends AnyWatchPausableSource,
	Immediate extends boolean = false,
>(
	source: TSource,
	callback: WatchPausableCallback<
		WatchPausableSourceValue<TSource>,
		Immediate extends true
			? WatchPausableSourceValue<TSource> | undefined
			: WatchPausableSourceValue<TSource>
	>,
	options?: WatchPausableOptions<Immediate>,
): WatchPausableReturn;
export function watchPausable<Immediate extends boolean = false>(
	source: WatchPausableInput,
	callback: ImplementationWatchCallback,
	options: WatchPausableOptions<Immediate> = {},
): WatchPausableReturn {
	const { initialState = "active", ...watchOptions } = options;
	const active = signal(initialState === "active");
	const runCallback = callback as InternalWatchPausableCallback;
	const stop = watchSource(
		source,
		(value, oldValue, onCleanup) => {
			if (!active.value) {
				return;
			}

			return runCallback(value, oldValue, onCleanup);
		},
		watchOptions as WatchOptions,
	);

	return {
		isActive: readonly(active),
		pause() {
			active.value = false;
		},
		resume() {
			active.value = true;
		},
		stop,
	};
}
