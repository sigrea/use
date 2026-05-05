import { readonly, signal } from "@sigrea/core";

import { resolveValue } from "../../shared";
import type {
	MaybeValue,
	UseCountdownOptions,
	UseCountdownReturn,
} from "../types";
import { useIntervalFn } from "../useIntervalFn";

function resolveCountdown(value: MaybeValue<number>): number {
	return Math.max(0, resolveValue(value));
}

export function useCountdown(
	initialValue: MaybeValue<number>,
	options: UseCountdownOptions = {},
): UseCountdownReturn {
	const remaining = signal(resolveCountdown(initialValue));
	const createScheduler =
		options.scheduler ??
		((callback: () => void) =>
			useIntervalFn(callback, options.interval ?? 1000, {
				immediate: options.immediate === true && remaining.value > 0,
			}));

	let pauseAfterCreate = false;
	let pause = () => {
		pauseAfterCreate = true;
	};
	const tick = () => {
		if (remaining.value <= 0) {
			pause();
			return;
		}

		remaining.value = Math.max(0, remaining.value - 1);
		options.onTick?.(remaining.value);

		if (remaining.value <= 0) {
			pause();
			options.onComplete?.();
		}
	};

	const controls = createScheduler(tick);
	pause = () => {
		controls.pause();
	};
	if (pauseAfterCreate) {
		pause();
	}

	const reset = (countdown?: MaybeValue<number>) => {
		remaining.value = resolveCountdown(countdown ?? initialValue);
	};
	const resume = () => {
		if (remaining.value <= 0 || controls.isActive.value) {
			return;
		}

		controls.resume();
	};
	const stop = () => {
		pause();
		reset();
	};
	const start = (countdown?: MaybeValue<number>) => {
		reset(countdown);
		if (remaining.value <= 0) {
			pause();
			return;
		}

		controls.resume();
	};

	return {
		remaining: readonly(remaining),
		isActive: controls.isActive,
		pause,
		resume,
		reset,
		stop,
		start,
	};
}
