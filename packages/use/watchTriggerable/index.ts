import { isDeepSignal, toValue } from "@sigrea/core";
import type { Cleanup, DeepSignal, ReadonlyDeepSignal } from "@sigrea/core";
import type { WatchSource } from "@sigrea/core";

import type {
	WatchTriggerableCallback,
	WatchTriggerableOptions,
	WatchTriggerableReturn,
	WatchTriggerableSourceOldValues,
	WatchTriggerableSourceValue,
	WatchTriggerableSourceValues,
} from "../types";
import { watchIgnorable } from "../watchIgnorable";

type AnyWatchTriggerableSource =
	| WatchSource<unknown>
	| DeepSignal<object>
	| ReadonlyDeepSignal<object>;
type WatchTriggerableSourceList = readonly AnyWatchTriggerableSource[];
type WatchTriggerableInput =
	| AnyWatchTriggerableSource
	| WatchTriggerableSourceList;
type InternalWatchTriggerableCallback = WatchTriggerableCallback<
	unknown,
	unknown,
	unknown
>;
type ImplementationWatchCallback = (...args: never[]) => unknown;

function isSourceList(
	source: WatchTriggerableInput,
): source is WatchTriggerableSourceList {
	return Array.isArray(source) && !isDeepSignal(source);
}

function readSourceValue(source: AnyWatchTriggerableSource): unknown {
	if (isDeepSignal(source)) {
		return source;
	}

	return toValue(source as WatchSource<unknown>);
}

function readWatchSource(source: WatchTriggerableInput): unknown {
	return isSourceList(source)
		? source.map((entry) => readSourceValue(entry))
		: readSourceValue(source);
}

function createManualOldValue(source: WatchTriggerableInput): unknown {
	return isSourceList(source) ? source.map(() => undefined) : undefined;
}

/**
 * Watch a source and expose a manual trigger.
 */
export function watchTriggerable<
	TSources extends readonly AnyWatchTriggerableSource[],
	TriggerReturn = void,
>(
	source: readonly [...TSources],
	callback: WatchTriggerableCallback<
		WatchTriggerableSourceValues<TSources>,
		WatchTriggerableSourceOldValues<TSources> | [],
		TriggerReturn
	>,
	options?: WatchTriggerableOptions<boolean>,
): WatchTriggerableReturn<TriggerReturn>;
export function watchTriggerable<
	TSource extends AnyWatchTriggerableSource,
	TriggerReturn = void,
>(
	source: TSource,
	callback: WatchTriggerableCallback<
		WatchTriggerableSourceValue<TSource>,
		WatchTriggerableSourceValue<TSource> | undefined,
		TriggerReturn
	>,
	options?: WatchTriggerableOptions<boolean>,
): WatchTriggerableReturn<TriggerReturn>;
export function watchTriggerable<TriggerReturn = void>(
	source: WatchTriggerableInput,
	callback: ImplementationWatchCallback,
	options: WatchTriggerableOptions<boolean> = {},
): WatchTriggerableReturn<TriggerReturn> {
	const runCallback = callback as InternalWatchTriggerableCallback;
	let cleanup: Cleanup | undefined;
	let cleanupRunId = 0;
	let activeCleanupRunId = 0;
	let stopped = false;

	function runCleanup(): void {
		if (cleanup === undefined) {
			return;
		}

		const cleanupToRun = cleanup;
		cleanup = undefined;
		void cleanupToRun();
	}

	function createOnCleanup(context: number) {
		return (cleanupFn: Cleanup) => {
			if (stopped) {
				void cleanupFn();
				return;
			}

			if (context !== activeCleanupRunId) {
				if (context < activeCleanupRunId) {
					void cleanupFn();
				}
				return;
			}

			cleanup = cleanupFn;
		};
	}

	function runUserCallback(value: unknown, oldValue: unknown): unknown {
		const context = cleanupRunId + 1;
		cleanupRunId = context;
		activeCleanupRunId = context;
		runCleanup();
		return runCallback(value, oldValue, createOnCleanup(context));
	}

	const controls = watchIgnorable(
		source as WatchSource<unknown>,
		(value, oldValue) => {
			if (stopped) {
				return;
			}

			runUserCallback(value, oldValue);
		},
		options,
	);

	function stop(): void {
		if (stopped) {
			return;
		}

		stopped = true;
		activeCleanupRunId = 0;
		controls.stop();
		runCleanup();
	}

	function trigger(): TriggerReturn | undefined {
		if (stopped) {
			return undefined;
		}

		let result: TriggerReturn | undefined;
		controls.ignoreUpdates(() => {
			if (stopped) {
				return;
			}

			result = runUserCallback(
				readWatchSource(source),
				createManualOldValue(source),
			) as TriggerReturn;
		});
		return result;
	}

	return {
		...controls,
		stop,
		trigger,
	};
}
