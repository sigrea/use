import {
	createScope,
	disposeScope,
	getCurrentScope,
	isDeepSignal,
	runWithScope,
	watch,
} from "@sigrea/core";
import type {
	Cleanup,
	DeepSignal,
	ReadonlyDeepSignal,
	WatchOptions,
	WatchSource,
	WatchStopHandle,
} from "@sigrea/core";

import type {
	WatchThrottledCallback,
	WatchThrottledOptions,
	WatchThrottledReturn,
	WatchThrottledSourceValue,
	WatchThrottledSourceValues,
} from "../types";
import { useThrottleFn } from "../useThrottleFn";

type AnyWatchThrottledSource =
	| WatchSource<unknown>
	| DeepSignal<object>
	| ReadonlyDeepSignal<object>;
type WatchThrottledSourceList = readonly AnyWatchThrottledSource[];
type WatchThrottledInput = AnyWatchThrottledSource | WatchThrottledSourceList;
type InternalWatchThrottledCallback = WatchThrottledCallback<unknown, unknown>;
type ImplementationWatchCallback = (...args: never[]) => unknown;

function isSourceList(
	source: WatchThrottledInput,
): source is WatchThrottledSourceList {
	return Array.isArray(source) && !isDeepSignal(source);
}

function handleCallbackResult(
	result: void | Cleanup | Promise<void | Cleanup>,
	onCleanup: (cleanup: Cleanup) => void,
): void | Promise<void> {
	if (typeof result === "function") {
		onCleanup(result);
		return;
	}

	return Promise.resolve(result).then((resolved) => {
		if (typeof resolved === "function") {
			onCleanup(resolved);
		}
	});
}

/**
 * Throttled watch.
 */
export function watchThrottled<
	TSources extends readonly AnyWatchThrottledSource[],
>(
	source: readonly [...TSources],
	callback: WatchThrottledCallback<
		WatchThrottledSourceValues<TSources>,
		WatchThrottledSourceValues<TSources>
	>,
	options?: WatchThrottledOptions<false>,
): WatchThrottledReturn;
export function watchThrottled<
	TSources extends readonly AnyWatchThrottledSource[],
	Immediate extends boolean = false,
>(
	source: readonly [...TSources],
	callback: WatchThrottledCallback<
		WatchThrottledSourceValues<TSources>,
		Immediate extends true
			? WatchThrottledSourceValues<TSources> | []
			: WatchThrottledSourceValues<TSources>
	>,
	options?: WatchThrottledOptions<Immediate>,
): WatchThrottledReturn;
export function watchThrottled<TSource extends AnyWatchThrottledSource>(
	source: TSource,
	callback: WatchThrottledCallback<
		WatchThrottledSourceValue<TSource>,
		WatchThrottledSourceValue<TSource>
	>,
	options?: WatchThrottledOptions<false>,
): WatchThrottledReturn;
export function watchThrottled<
	TSource extends AnyWatchThrottledSource,
	Immediate extends boolean = false,
>(
	source: TSource,
	callback: WatchThrottledCallback<
		WatchThrottledSourceValue<TSource>,
		Immediate extends true
			? WatchThrottledSourceValue<TSource> | undefined
			: WatchThrottledSourceValue<TSource>
	>,
	options?: WatchThrottledOptions<Immediate>,
): WatchThrottledReturn;
export function watchThrottled<Immediate extends boolean = false>(
	source: WatchThrottledInput,
	callback: ImplementationWatchCallback,
	options: WatchThrottledOptions<Immediate> = {},
): WatchThrottledReturn {
	const {
		leading = true,
		throttle = 0,
		trailing = true,
		...watchOptions
	} = options;
	const runCallback = callback as InternalWatchThrottledCallback;
	const scope = createScope(getCurrentScope());
	let stopped = false;

	const throttled = runWithScope(scope, () =>
		useThrottleFn(
			(
				value: unknown,
				oldValue: unknown,
				onCleanup: (cleanup: Cleanup) => void,
			) =>
				handleCallbackResult(
					runCallback(value, oldValue, onCleanup),
					onCleanup,
				),
			throttle,
			trailing,
			leading,
		),
	);

	const run: InternalWatchThrottledCallback = (value, oldValue, onCleanup) => {
		if (stopped) {
			return;
		}

		return throttled(value, oldValue, onCleanup);
	};

	const stopWatch: WatchStopHandle = isSourceList(source)
		? watch(
				source as readonly WatchSource<unknown>[],
				run,
				watchOptions as WatchOptions,
			)
		: watch(source as WatchSource<unknown>, run, watchOptions as WatchOptions);

	return () => {
		if (stopped) {
			return;
		}

		stopped = true;
		stopWatch();
		disposeScope(scope);
	};
}
