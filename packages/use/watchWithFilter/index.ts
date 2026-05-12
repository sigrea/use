import { isDeepSignal, watch } from "@sigrea/core";
import type {
	Cleanup,
	DeepSignal,
	ReadonlyDeepSignal,
	WatchOptions,
	WatchSource,
	WatchStopHandle,
} from "@sigrea/core";

import type {
	EventFilter,
	FunctionWrapperOptions,
	WatchWithFilterCallback,
	WatchWithFilterOptions,
	WatchWithFilterReturn,
	WatchWithFilterSourceValue,
	WatchWithFilterSourceValues,
} from "../types";

type AnyWatchWithFilterSource =
	| WatchSource<unknown>
	| DeepSignal<object>
	| ReadonlyDeepSignal<object>;
type WatchWithFilterSourceList = readonly AnyWatchWithFilterSource[];
type WatchWithFilterInput =
	| AnyWatchWithFilterSource
	| WatchWithFilterSourceList;
type InternalWatchWithFilterCallback = WatchWithFilterCallback<
	unknown,
	unknown
>;
type ImplementationWatchCallback = (...args: never[]) => unknown;
type InternalCallbackArgs = [
	value: unknown,
	oldValue: unknown,
	onCleanup: (cleanup: Cleanup) => void,
];
type InternalCallbackResult = void | Cleanup | Promise<void | Cleanup>;

const bypassFilter: EventFilter = (invoke) => invoke();

function isSourceList(
	source: WatchWithFilterInput,
): source is WatchWithFilterSourceList {
	return Array.isArray(source) && !isDeepSignal(source);
}

function createFilteredCallback(
	callback: InternalWatchWithFilterCallback,
	eventFilter: EventFilter,
	isStopped: () => boolean,
): InternalWatchWithFilterCallback {
	const filter = eventFilter as EventFilter<
		InternalCallbackArgs,
		unknown,
		() => InternalCallbackResult
	>;

	return function filteredCallback(this: unknown, value, oldValue, onCleanup) {
		const args: InternalCallbackArgs = [value, oldValue, onCleanup];
		const options: FunctionWrapperOptions<InternalCallbackArgs, unknown> = {
			args,
			fn: callback,
			thisArg: this,
		};

		return filter(() => {
			if (isStopped()) {
				return;
			}

			return callback.apply(this, args);
		}, options) as InternalCallbackResult;
	};
}

/**
 * Watch a source and run the callback through an event filter.
 */
export function watchWithFilter<
	TSources extends readonly AnyWatchWithFilterSource[],
>(
	source: readonly [...TSources],
	callback: WatchWithFilterCallback<
		WatchWithFilterSourceValues<TSources>,
		WatchWithFilterSourceValues<TSources>
	>,
	options?: WatchWithFilterOptions<false>,
): WatchWithFilterReturn;
export function watchWithFilter<
	TSources extends readonly AnyWatchWithFilterSource[],
	Immediate extends boolean = false,
>(
	source: readonly [...TSources],
	callback: WatchWithFilterCallback<
		WatchWithFilterSourceValues<TSources>,
		Immediate extends true
			? WatchWithFilterSourceValues<TSources> | []
			: WatchWithFilterSourceValues<TSources>
	>,
	options?: WatchWithFilterOptions<Immediate>,
): WatchWithFilterReturn;
export function watchWithFilter<TSource extends AnyWatchWithFilterSource>(
	source: TSource,
	callback: WatchWithFilterCallback<
		WatchWithFilterSourceValue<TSource>,
		WatchWithFilterSourceValue<TSource>
	>,
	options?: WatchWithFilterOptions<false>,
): WatchWithFilterReturn;
export function watchWithFilter<
	TSource extends AnyWatchWithFilterSource,
	Immediate extends boolean = false,
>(
	source: TSource,
	callback: WatchWithFilterCallback<
		WatchWithFilterSourceValue<TSource>,
		Immediate extends true
			? WatchWithFilterSourceValue<TSource> | undefined
			: WatchWithFilterSourceValue<TSource>
	>,
	options?: WatchWithFilterOptions<Immediate>,
): WatchWithFilterReturn;
export function watchWithFilter<Immediate extends boolean = false>(
	source: WatchWithFilterInput,
	callback: ImplementationWatchCallback,
	options: WatchWithFilterOptions<Immediate> = {},
): WatchWithFilterReturn {
	const { eventFilter = bypassFilter, ...watchOptions } = options;
	let stopped = false;
	const run = createFilteredCallback(
		callback as InternalWatchWithFilterCallback,
		eventFilter,
		() => stopped,
	);

	const stopWatch: WatchStopHandle = isSourceList(source)
		? watch(source as readonly WatchSource<unknown>[], run, watchOptions)
		: watch(source as WatchSource<unknown>, run, watchOptions as WatchOptions);

	return () => {
		if (stopped) {
			return;
		}

		stopped = true;
		stopWatch();
	};
}
