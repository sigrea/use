import { readonly, signal } from "@sigrea/core";
import { resolveValue } from "../../shared/resolveValue";

import type { UseCounterOptions, UseCounterReturn } from "../types";
import type { MaybeValue } from "../types";

function clamp(value: number, min?: number, max?: number): number {
	let next = value;
	if (min !== undefined && next < min) {
		next = min;
	}
	if (max !== undefined && next > max) {
		next = max;
	}
	return next;
}

export function useCounter(
	initialValue: MaybeValue<number> = 0,
	options: UseCounterOptions = {},
): UseCounterReturn {
	const step = options.step ?? 1;
	let initial = clamp(resolveValue(initialValue), options.min, options.max);
	const count = signal(initial);

	const set = (value: number) => {
		count.value = clamp(value, options.min, options.max);
	};

	const inc = (delta = step) => {
		set(count.value + delta);
	};

	const dec = (delta = step) => {
		set(count.value - delta);
	};

	const get = () => {
		return count.value;
	};

	const reset = (value = initial) => {
		initial = clamp(value, options.min, options.max);
		set(initial);
		return count.value;
	};

	return {
		count: readonly(count),
		dec,
		get,
		inc,
		reset,
		set,
	};
}
