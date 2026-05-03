import { readonly, signal, watch } from "@sigrea/core";
import { resolveValue } from "../../shared/resolveValue";

import { bindAutoStart } from "../internal";

import type {
	MaybeValue,
	UseIntervalFnOptions,
	UseIntervalFnReturn,
} from "../types";

export function useIntervalFn(
	callback: () => void,
	interval: MaybeValue<number> = 1000,
	options: UseIntervalFnOptions = {},
): UseIntervalFnReturn {
	const isActive = signal(false);
	let timer: ReturnType<typeof setInterval> | undefined;
	let stopWatchingInterval: (() => void) | undefined;

	const clear = () => {
		if (timer !== undefined) {
			clearInterval(timer);
			timer = undefined;
		}
	};

	const startWatchingInterval = () => {
		if (stopWatchingInterval !== undefined) {
			return;
		}

		stopWatchingInterval = watch(
			() => resolveValue(interval),
			(nextInterval) => {
				if (!isActive.value) {
					return;
				}

				if (nextInterval <= 0) {
					pause();
					return;
				}

				resume();
			},
			{ flush: "sync" },
		);
	};

	const stopWatching = () => {
		if (stopWatchingInterval === undefined) {
			return;
		}

		stopWatchingInterval();
		stopWatchingInterval = undefined;
	};

	const pause = () => {
		stopWatching();
		clear();
		isActive.value = false;
	};

	const resume = () => {
		const nextInterval = resolveValue(interval);
		if (nextInterval <= 0) {
			pause();
			return;
		}

		isActive.value = true;

		if (options.immediateCallback) {
			callback();
		}

		if (!isActive.value) {
			return;
		}

		const currentInterval = resolveValue(interval);
		if (currentInterval <= 0) {
			pause();
			return;
		}

		clear();
		timer = setInterval(callback, currentInterval);
		startWatchingInterval();
	};

	bindAutoStart(resume, pause, options.immediate ?? true);

	return {
		isActive: readonly(isActive),
		pause,
		resume,
	};
}
