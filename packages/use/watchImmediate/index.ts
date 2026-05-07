import { isDeepSignal, watch } from "@sigrea/core";
import type {
	DeepSignal,
	ReadonlyDeepSignal,
	WatchOptions,
	WatchSource,
} from "@sigrea/core";

import type {
	WatchImmediateCallback,
	WatchImmediateOptions,
	WatchImmediateReturn,
	WatchImmediateSourceValue,
	WatchImmediateSourceValues,
} from "../types";

type AnyWatchImmediateSource =
	| WatchSource<unknown>
	| DeepSignal<object>
	| ReadonlyDeepSignal<object>;
type WatchImmediateSourceList = readonly AnyWatchImmediateSource[];
type WatchImmediateInput = AnyWatchImmediateSource | WatchImmediateSourceList;
type InternalWatchImmediateCallback = WatchImmediateCallback<unknown, unknown>;
type ImplementationWatchCallback = (...args: never[]) => unknown;

function isSourceList(
	source: WatchImmediateInput,
): source is WatchImmediateSourceList {
	return Array.isArray(source) && !isDeepSignal(source);
}

/**
 * Watch a source with `immediate: true`.
 */
export function watchImmediate<
	TSources extends readonly AnyWatchImmediateSource[],
>(
	source: readonly [...TSources],
	callback: WatchImmediateCallback<
		WatchImmediateSourceValues<TSources>,
		WatchImmediateSourceValues<TSources> | []
	>,
	options?: WatchImmediateOptions,
): WatchImmediateReturn;
export function watchImmediate<TSource extends AnyWatchImmediateSource>(
	source: TSource,
	callback: WatchImmediateCallback<WatchImmediateSourceValue<TSource>>,
	options?: WatchImmediateOptions,
): WatchImmediateReturn;
export function watchImmediate(
	source: WatchImmediateInput,
	callback: ImplementationWatchCallback,
	options: WatchImmediateOptions = {},
): WatchImmediateReturn {
	const runCallback = callback as InternalWatchImmediateCallback;
	const watchOptions = {
		...options,
		immediate: true,
	} as WatchOptions<true>;

	return isSourceList(source)
		? watch(
				source as readonly WatchSource<unknown>[],
				runCallback,
				watchOptions,
			)
		: watch(source as WatchSource<unknown>, runCallback, watchOptions);
}
