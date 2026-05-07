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
	WatchDebouncedCallback,
	WatchDebouncedOptions,
	WatchDebouncedReturn,
	WatchDebouncedSourceValue,
	WatchDebouncedSourceValues,
} from "../types";
import { useDebounceFn } from "../useDebounceFn";

type AnyWatchDebouncedSource =
	| WatchSource<unknown>
	| DeepSignal<object>
	| ReadonlyDeepSignal<object>;
type WatchDebouncedSourceList = readonly AnyWatchDebouncedSource[];
type WatchDebouncedInput = AnyWatchDebouncedSource | WatchDebouncedSourceList;
type InternalWatchDebouncedCallback = WatchDebouncedCallback<unknown, boolean>;
type ImplementationWatchCallback = (...args: never[]) => unknown;

function isSourceList(
	source: WatchDebouncedInput,
): source is WatchDebouncedSourceList {
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
 * Debounced watch.
 */
export function watchDebounced<
	TSources extends readonly AnyWatchDebouncedSource[],
>(
	source: readonly [...TSources],
	callback: WatchDebouncedCallback<WatchDebouncedSourceValues<TSources>, false>,
	options?: WatchDebouncedOptions<false>,
): WatchDebouncedReturn;
export function watchDebounced<
	TSources extends readonly AnyWatchDebouncedSource[],
	Immediate extends boolean = false,
>(
	source: readonly [...TSources],
	callback: WatchDebouncedCallback<
		WatchDebouncedSourceValues<TSources>,
		Immediate
	>,
	options?: WatchDebouncedOptions<Immediate>,
): WatchDebouncedReturn;
export function watchDebounced<TSource extends AnyWatchDebouncedSource>(
	source: TSource,
	callback: WatchDebouncedCallback<WatchDebouncedSourceValue<TSource>, false>,
	options?: WatchDebouncedOptions<false>,
): WatchDebouncedReturn;
export function watchDebounced<
	TSource extends AnyWatchDebouncedSource,
	Immediate extends boolean = false,
>(
	source: TSource,
	callback: WatchDebouncedCallback<
		WatchDebouncedSourceValue<TSource>,
		Immediate
	>,
	options?: WatchDebouncedOptions<Immediate>,
): WatchDebouncedReturn;
export function watchDebounced<Immediate extends boolean = false>(
	source: WatchDebouncedInput,
	callback: ImplementationWatchCallback,
	options: WatchDebouncedOptions<Immediate> = {},
): WatchDebouncedReturn {
	const { debounce = 0, maxWait, ...watchOptions } = options;
	const runCallback = callback as InternalWatchDebouncedCallback;
	const scope = createScope(getCurrentScope());
	let stopped = false;

	const debounced = runWithScope(scope, () =>
		useDebounceFn(
			(
				value: unknown,
				oldValue: unknown,
				onCleanup: (cleanup: Cleanup) => void,
			) =>
				handleCallbackResult(
					runCallback(value, oldValue, onCleanup),
					onCleanup,
				),
			debounce,
			{ maxWait },
		),
	);

	const run: InternalWatchDebouncedCallback = (value, oldValue, onCleanup) => {
		if (stopped) {
			return;
		}

		return debounced(value, oldValue, onCleanup);
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
