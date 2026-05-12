import { watch } from "@sigrea/core";
import type { Cleanup, WatchOptions, WatchSource } from "@sigrea/core";

import type {
	WheneverCallback,
	WheneverOptions,
	WheneverReturn,
} from "../types";

type InternalWheneverCallback = WheneverCallback<unknown, unknown>;
type ImplementationWatchCallback = (...args: never[]) => unknown;

/**
 * Watch a source and run the callback only when its value is truthy.
 */
export function whenever<T>(
	source: WatchSource<T>,
	callback: WheneverCallback<T, T>,
	options?: WheneverOptions<false>,
): WheneverReturn;
export function whenever<T, Immediate extends boolean = false>(
	source: WatchSource<T>,
	callback: WheneverCallback<T, Immediate extends true ? T | undefined : T>,
	options?: WheneverOptions<Immediate>,
): WheneverReturn;
export function whenever<Immediate extends boolean = false>(
	source: WatchSource<unknown>,
	callback: ImplementationWatchCallback,
	options: WheneverOptions<Immediate> = {},
): WheneverReturn {
	const { once = false, ...watchOptions } = options;
	const runCallback = callback as InternalWheneverCallback;
	let stopWatch: WheneverReturn | undefined;
	let stopped = false;
	let pendingStop = false;
	let initializing = true;
	let hasRun = false;
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
		stopped = true;
		if (stopWatch === undefined) {
			pendingStop = true;
			return;
		}

		pendingStop = false;
		runStopHandle();
	}

	const run: InternalWheneverCallback = (value, oldValue, onCleanup) => {
		if (!value) {
			return;
		}

		if (once) {
			if (hasRun) {
				requestStop();
				return;
			}

			hasRun = true;
		}

		try {
			return runCallback(value, oldValue, onCleanup);
		} catch (error) {
			if (!once || !initializing) {
				throw error;
			}

			hasPendingError = true;
			pendingError = error;
		} finally {
			if (once) {
				requestStop();
			}
		}
	};

	try {
		stopWatch = watch(
			source as WatchSource<unknown>,
			run as (
				value: unknown,
				oldValue: unknown,
				onCleanup: (cleanup: Cleanup) => void,
			) => ReturnType<InternalWheneverCallback>,
			watchOptions as WatchOptions,
		);
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
