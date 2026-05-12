import { isDeepSignal, watch } from "@sigrea/core";
import type {
	DeepSignal,
	ReadonlyDeepSignal,
	WatchOptions,
	WatchSource,
} from "@sigrea/core";

import type {
	WatchDeepCallback,
	WatchDeepOptions,
	WatchDeepReturn,
	WatchDeepSourceValue,
	WatchDeepSourceValues,
} from "../types";

type AnyWatchDeepSource =
	| WatchSource<unknown>
	| DeepSignal<object>
	| ReadonlyDeepSignal<object>;
type WatchDeepSourceList = readonly AnyWatchDeepSource[];
type WatchDeepInput = AnyWatchDeepSource | WatchDeepSourceList;
type InternalWatchDeepCallback = WatchDeepCallback<unknown, boolean>;
type ImplementationWatchCallback = (...args: never[]) => unknown;

function isSourceList(source: WatchDeepInput): source is WatchDeepSourceList {
	return Array.isArray(source) && !isDeepSignal(source);
}

/**
 * Watch a source with `deep: true`.
 */
export function watchDeep<TSources extends readonly AnyWatchDeepSource[]>(
	source: readonly [...TSources],
	callback: WatchDeepCallback<WatchDeepSourceValues<TSources>, false>,
	options?: WatchDeepOptions<false>,
): WatchDeepReturn;
export function watchDeep<
	TSources extends readonly AnyWatchDeepSource[],
	Immediate extends boolean = false,
>(
	source: readonly [...TSources],
	callback: WatchDeepCallback<WatchDeepSourceValues<TSources>, Immediate>,
	options?: WatchDeepOptions<Immediate>,
): WatchDeepReturn;
export function watchDeep<TSource extends AnyWatchDeepSource>(
	source: TSource,
	callback: WatchDeepCallback<WatchDeepSourceValue<TSource>, false>,
	options?: WatchDeepOptions<false>,
): WatchDeepReturn;
export function watchDeep<
	TSource extends AnyWatchDeepSource,
	Immediate extends boolean = false,
>(
	source: TSource,
	callback: WatchDeepCallback<WatchDeepSourceValue<TSource>, Immediate>,
	options?: WatchDeepOptions<Immediate>,
): WatchDeepReturn;
export function watchDeep<Immediate extends boolean = false>(
	source: WatchDeepInput,
	callback: ImplementationWatchCallback,
	options: WatchDeepOptions<Immediate> = {},
): WatchDeepReturn {
	const runCallback = callback as InternalWatchDeepCallback;
	const watchOptions = {
		...options,
		deep: true,
	} as WatchOptions;

	return isSourceList(source)
		? watch(
				source as readonly WatchSource<unknown>[],
				runCallback,
				watchOptions,
			)
		: watch(source as WatchSource<unknown>, runCallback, watchOptions);
}
