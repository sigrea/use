import { isDeepSignal, nextTick, readonly, signal, watch } from "@sigrea/core";
import type {
	DeepSignal,
	ReadonlyDeepSignal,
	WatchOptions,
	WatchSource,
	WatchStopHandle,
} from "@sigrea/core";

import { resolveValue } from "../../shared";
import type {
	WatchAtMostCallback,
	WatchAtMostOptions,
	WatchAtMostReturn,
	WatchAtMostSourceValue,
	WatchAtMostSourceValues,
} from "../types";

type AnyWatchAtMostSource =
	| WatchSource<unknown>
	| DeepSignal<object>
	| ReadonlyDeepSignal<object>;
type WatchAtMostSourceList = readonly AnyWatchAtMostSource[];
type WatchAtMostInput = AnyWatchAtMostSource | WatchAtMostSourceList;
type InternalWatchCallback = WatchAtMostCallback<unknown, boolean>;
type ImplementationWatchCallback = (...args: never[]) => unknown;

function isSourceList(
	source: WatchAtMostInput,
): source is WatchAtMostSourceList {
	return Array.isArray(source) && !isDeepSignal(source);
}

function resolveLimit(count: WatchAtMostOptions["count"]): number {
	const value = resolveValue(count);

	if (value === Number.POSITIVE_INFINITY) {
		return Number.POSITIVE_INFINITY;
	}

	if (!Number.isFinite(value)) {
		return 0;
	}

	return Math.max(0, Math.floor(value));
}

/**
 * Watch a source and run the callback at most `count` times.
 */
export function watchAtMost<TSources extends readonly AnyWatchAtMostSource[]>(
	source: readonly [...TSources],
	callback: WatchAtMostCallback<WatchAtMostSourceValues<TSources>, false>,
	options: WatchAtMostOptions<false>,
): WatchAtMostReturn;
export function watchAtMost<
	TSources extends readonly AnyWatchAtMostSource[],
	Immediate extends boolean = false,
>(
	source: readonly [...TSources],
	callback: WatchAtMostCallback<WatchAtMostSourceValues<TSources>, Immediate>,
	options: WatchAtMostOptions<Immediate>,
): WatchAtMostReturn;
export function watchAtMost<TSource extends AnyWatchAtMostSource>(
	source: TSource,
	callback: WatchAtMostCallback<WatchAtMostSourceValue<TSource>, false>,
	options: WatchAtMostOptions<false>,
): WatchAtMostReturn;
export function watchAtMost<
	TSource extends AnyWatchAtMostSource,
	Immediate extends boolean = false,
>(
	source: TSource,
	callback: WatchAtMostCallback<WatchAtMostSourceValue<TSource>, Immediate>,
	options: WatchAtMostOptions<Immediate>,
): WatchAtMostReturn;
export function watchAtMost<Immediate extends boolean = false>(
	source: WatchAtMostInput,
	callback: ImplementationWatchCallback,
	options: WatchAtMostOptions<Immediate>,
): WatchAtMostReturn {
	const { count: maxCount, ...watchOptions } = options;
	const runCallback = callback as InternalWatchCallback;
	const count = signal(0);
	let stopWatch: WatchStopHandle | undefined;
	let stopped = false;
	let stopScheduled = false;

	function hasReachedLimit(): boolean {
		return count.peek() >= resolveLimit(maxCount);
	}

	function stop(): void {
		if (stopped) {
			return;
		}

		stopped = true;
		stopWatch?.();
		stopWatch = undefined;
	}

	function scheduleStop(): void {
		if (stopped || stopScheduled) {
			return;
		}

		stopScheduled = true;
		void nextTick(() => {
			stopScheduled = false;
			stop();
		});
	}

	const run: InternalWatchCallback = (value, oldValue, onCleanup) => {
		if (stopped || hasReachedLimit()) {
			scheduleStop();
			return;
		}

		count.value = count.peek() + 1;
		try {
			return runCallback(value, oldValue, onCleanup);
		} finally {
			if (hasReachedLimit()) {
				scheduleStop();
			}
		}
	};

	stopWatch = isSourceList(source)
		? watch(
				source as readonly WatchSource<unknown>[],
				run,
				watchOptions as WatchOptions,
			)
		: watch(source as WatchSource<unknown>, run, watchOptions as WatchOptions);

	if (hasReachedLimit()) {
		stop();
	}

	return {
		count: readonly(count),
		stop,
	};
}
