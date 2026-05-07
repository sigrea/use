import { isDeepSignal, watch } from "@sigrea/core";
import type {
	DeepSignal,
	ReadonlyDeepSignal,
	WatchOptions,
	WatchSource,
	WatchStopHandle,
} from "@sigrea/core";

import type {
	WatchOnceCallback,
	WatchOnceOptions,
	WatchOnceReturn,
	WatchOnceSourceValue,
	WatchOnceSourceValues,
} from "../types";

type AnyWatchOnceSource =
	| WatchSource<unknown>
	| DeepSignal<object>
	| ReadonlyDeepSignal<object>;
type WatchOnceSourceList = readonly AnyWatchOnceSource[];
type WatchOnceInput = AnyWatchOnceSource | WatchOnceSourceList;
type InternalWatchOnceCallback = WatchOnceCallback<unknown, unknown>;
type ImplementationWatchCallback = (...args: never[]) => unknown;

function isSourceList(source: WatchOnceInput): source is WatchOnceSourceList {
	return Array.isArray(source) && !isDeepSignal(source);
}

function watchSource(
	source: WatchOnceInput,
	callback: InternalWatchOnceCallback,
	options: WatchOptions,
): WatchStopHandle {
	return isSourceList(source)
		? watch(source as readonly WatchSource<unknown>[], callback, options)
		: watch(source as WatchSource<unknown>, callback, options);
}

/**
 * Watch a source and stop after the first callback run.
 */
export function watchOnce<TSources extends readonly AnyWatchOnceSource[]>(
	source: readonly [...TSources],
	callback: WatchOnceCallback<
		WatchOnceSourceValues<TSources>,
		WatchOnceSourceValues<TSources>
	>,
	options?: WatchOnceOptions<false>,
): WatchOnceReturn;
export function watchOnce<
	TSources extends readonly AnyWatchOnceSource[],
	Immediate extends boolean = false,
>(
	source: readonly [...TSources],
	callback: WatchOnceCallback<
		WatchOnceSourceValues<TSources>,
		Immediate extends true
			? WatchOnceSourceValues<TSources> | []
			: WatchOnceSourceValues<TSources>
	>,
	options?: WatchOnceOptions<Immediate>,
): WatchOnceReturn;
export function watchOnce<TSource extends AnyWatchOnceSource>(
	source: TSource,
	callback: WatchOnceCallback<
		WatchOnceSourceValue<TSource>,
		WatchOnceSourceValue<TSource>
	>,
	options?: WatchOnceOptions<false>,
): WatchOnceReturn;
export function watchOnce<
	TSource extends AnyWatchOnceSource,
	Immediate extends boolean = false,
>(
	source: TSource,
	callback: WatchOnceCallback<
		WatchOnceSourceValue<TSource>,
		Immediate extends true
			? WatchOnceSourceValue<TSource> | undefined
			: WatchOnceSourceValue<TSource>
	>,
	options?: WatchOnceOptions<Immediate>,
): WatchOnceReturn;
export function watchOnce<Immediate extends boolean = false>(
	source: WatchOnceInput,
	callback: ImplementationWatchCallback,
	options: WatchOnceOptions<Immediate> = {},
): WatchOnceReturn {
	const runCallback = callback as InternalWatchOnceCallback;
	let stopWatch: WatchStopHandle | undefined;
	let stopped = false;
	let hasRun = false;
	let pendingStop = false;
	let initializing = true;
	let hasPendingError = false;
	let pendingError: unknown;

	function runStopHandle(): void {
		if (stopWatch === undefined) {
			return;
		}

		const stop = stopWatch;
		stopWatch = undefined;
		stop();
	}

	function requestStop(): void {
		if (stopped && !pendingStop) {
			return;
		}

		stopped = true;
		if (stopWatch === undefined) {
			pendingStop = true;
			return;
		}

		pendingStop = false;
		runStopHandle();
	}

	const run: InternalWatchOnceCallback = (value, oldValue, onCleanup) => {
		if (stopped || hasRun) {
			requestStop();
			return;
		}

		hasRun = true;
		try {
			return runCallback(value, oldValue, onCleanup);
		} catch (error) {
			if (!initializing) {
				throw error;
			}

			hasPendingError = true;
			pendingError = error;
		} finally {
			requestStop();
		}
	};

	try {
		stopWatch = watchSource(source, run, options as WatchOptions);
	} finally {
		initializing = false;
	}

	if (pendingStop) {
		pendingStop = false;
		runStopHandle();
	}

	if (hasPendingError) {
		throw pendingError;
	}

	return () => {
		if (stopWatch === undefined && stopped) {
			return;
		}

		stopped = true;
		pendingStop = false;
		runStopHandle();
	};
}
