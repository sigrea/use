import { type ReadonlySignal, readonly, signal } from "@sigrea/core";

import { useIntervalFn } from "../useIntervalFn";

import type {
	MaybeValue,
	UseIntervalControlsReturn,
	UseIntervalOptions,
	UseIntervalReturn,
} from "../types";

export function useInterval(
	interval?: MaybeValue<number>,
	options?: UseIntervalOptions<false>,
): ReadonlySignal<number>;
export function useInterval(
	interval: MaybeValue<number> | undefined,
	options: UseIntervalOptions<true>,
): UseIntervalControlsReturn;
export function useInterval(
	interval: MaybeValue<number> = 1000,
	options: UseIntervalOptions<boolean> = {},
): UseIntervalReturn {
	const {
		controls: exposeControls = false,
		immediate = true,
		callback,
	} = options;
	const counter = signal(0);
	const update = () => {
		counter.value += 1;
		callback?.(counter.value);
	};
	const controls = useIntervalFn(update, interval, { immediate });
	const readonlyCounter = readonly(counter);
	const reset = () => {
		counter.value = 0;
	};

	if (exposeControls) {
		return {
			counter: readonlyCounter,
			reset,
			...controls,
		};
	}

	return readonlyCounter;
}
