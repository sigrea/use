import { isDeepSignal, watch } from "@sigrea/core";
import type {
	DeepSignal,
	ReadonlyDeepSignal,
	WatchOptions,
	WatchSource,
	WatchStopHandle,
} from "@sigrea/core";

import type {
	WatchIgnorableCallback,
	WatchIgnorableOptions,
	WatchIgnorableReturn,
	WatchIgnorableSourceValue,
	WatchIgnorableSourceValues,
} from "../types";

type AnyWatchIgnorableSource =
	| WatchSource<unknown>
	| DeepSignal<object>
	| ReadonlyDeepSignal<object>;
type WatchIgnorableSourceList = readonly AnyWatchIgnorableSource[];
type WatchIgnorableInput = AnyWatchIgnorableSource | WatchIgnorableSourceList;
type InternalWatchIgnorableCallback = WatchIgnorableCallback<unknown, boolean>;
type ImplementationWatchCallback = (...args: never[]) => unknown;

function isSourceList(
	source: WatchIgnorableInput,
): source is WatchIgnorableSourceList {
	return Array.isArray(source) && !isDeepSignal(source);
}

function watchSource(
	source: WatchIgnorableInput,
	callback: InternalWatchIgnorableCallback,
	options: WatchOptions,
): WatchStopHandle {
	return isSourceList(source)
		? watch(source as readonly WatchSource<unknown>[], callback, options)
		: watch(source as WatchSource<unknown>, callback, options);
}

/**
 * Watch a source and expose helpers for ignoring selected source updates.
 */
export function watchIgnorable<
	TSources extends readonly AnyWatchIgnorableSource[],
>(
	source: readonly [...TSources],
	callback: WatchIgnorableCallback<WatchIgnorableSourceValues<TSources>, false>,
	options?: WatchIgnorableOptions<false>,
): WatchIgnorableReturn;
export function watchIgnorable<
	TSources extends readonly AnyWatchIgnorableSource[],
	Immediate extends boolean = false,
>(
	source: readonly [...TSources],
	callback: WatchIgnorableCallback<
		WatchIgnorableSourceValues<TSources>,
		Immediate
	>,
	options?: WatchIgnorableOptions<Immediate>,
): WatchIgnorableReturn;
export function watchIgnorable<TSource extends AnyWatchIgnorableSource>(
	source: TSource,
	callback: WatchIgnorableCallback<WatchIgnorableSourceValue<TSource>, false>,
	options?: WatchIgnorableOptions<false>,
): WatchIgnorableReturn;
export function watchIgnorable<
	TSource extends AnyWatchIgnorableSource,
	Immediate extends boolean = false,
>(
	source: TSource,
	callback: WatchIgnorableCallback<
		WatchIgnorableSourceValue<TSource>,
		Immediate
	>,
	options?: WatchIgnorableOptions<Immediate>,
): WatchIgnorableReturn;
export function watchIgnorable<Immediate extends boolean = false>(
	source: WatchIgnorableInput,
	callback: ImplementationWatchCallback,
	options: WatchIgnorableOptions<Immediate> = {},
): WatchIgnorableReturn {
	const runCallback = callback as InternalWatchIgnorableCallback;
	const watchOptions = options as WatchOptions;

	if (watchOptions.flush === "sync") {
		let ignoreDepth = 0;
		let stopped = false;
		const stopWatch = watchSource(
			source,
			(value, oldValue, onCleanup) => {
				if (ignoreDepth > 0) {
					return;
				}

				return runCallback(value, oldValue, onCleanup);
			},
			watchOptions,
		);

		return {
			ignoreUpdates(updater) {
				ignoreDepth += 1;
				try {
					updater();
				} finally {
					ignoreDepth -= 1;
				}
			},
			ignorePrevAsyncUpdates() {},
			stop() {
				if (stopped) {
					return;
				}

				stopped = true;
				stopWatch();
			},
		};
	}

	let ignoreCounter = 0;
	let syncCounter = 0;
	let stopped = false;
	const counterOptions = {
		deep: watchOptions.deep,
		flush: "sync",
	} as WatchOptions;
	const stops: WatchStopHandle[] = [
		watchSource(
			source,
			() => {
				syncCounter += 1;
			},
			counterOptions,
		),
		watchSource(
			source,
			(value, oldValue, onCleanup) => {
				const shouldIgnore = ignoreCounter > 0 && ignoreCounter === syncCounter;
				ignoreCounter = 0;
				syncCounter = 0;

				if (shouldIgnore) {
					return;
				}

				return runCallback(value, oldValue, onCleanup);
			},
			watchOptions,
		),
	];

	return {
		ignoreUpdates(updater) {
			const previousSyncCounter = syncCounter;
			try {
				updater();
			} finally {
				ignoreCounter += syncCounter - previousSyncCounter;
			}
		},
		ignorePrevAsyncUpdates() {
			ignoreCounter = syncCounter;
		},
		stop() {
			if (stopped) {
				return;
			}

			stopped = true;
			for (const stop of stops) {
				stop();
			}
		},
	};
}
