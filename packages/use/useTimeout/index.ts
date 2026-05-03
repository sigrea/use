import { type ReadonlySignal, computed } from "@sigrea/core";

import { useTimeoutFn } from "../useTimeoutFn";

import type {
	MaybeValue,
	UseTimeoutControlsReturn,
	UseTimeoutOptions,
	UseTimeoutReturn,
} from "../types";

function noop(): void {}

export function useTimeout(
	interval?: MaybeValue<number>,
	options?: UseTimeoutOptions<false>,
): ReadonlySignal<boolean>;
export function useTimeout(
	interval: MaybeValue<number> | undefined,
	options: UseTimeoutOptions<true>,
): UseTimeoutControlsReturn;
export function useTimeout(
	interval: MaybeValue<number> = 1000,
	options: UseTimeoutOptions<boolean> = {},
): UseTimeoutReturn {
	const { controls: exposeControls = false, callback } = options;
	const controls = useTimeoutFn(callback ?? noop, interval, options);
	const ready = computed(() => !controls.isPending.value);

	if (exposeControls) {
		return {
			ready,
			...controls,
		};
	}

	return ready;
}
