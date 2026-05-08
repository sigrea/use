import { computed, readonly, signal } from "@sigrea/core";

import { resolveValue } from "../../shared/resolveValue";
import type {
	MaybeValue,
	UseClampReturn,
	UseClampWritableReturn,
} from "../types";

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

function readClamped(
	source: { value: number },
	min: MaybeValue<number>,
	max: MaybeValue<number>,
): number {
	const next = clamp(source.value, resolveValue(min), resolveValue(max));
	source.value = next;
	return next;
}

/**
 * Reactively clamp a value between two other values.
 */
export function useClamp(
	value: number,
	min: MaybeValue<number>,
	max: MaybeValue<number>,
): UseClampWritableReturn;
export function useClamp(
	value: MaybeValue<number>,
	min: MaybeValue<number>,
	max: MaybeValue<number>,
): UseClampReturn;
export function useClamp(
	value: MaybeValue<number>,
	min: MaybeValue<number>,
	max: MaybeValue<number>,
): UseClampReturn | UseClampWritableReturn {
	if (typeof value === "number") {
		const source = signal(value);

		return computed({
			get: () => readClamped(source, min, max),
			set: (next) => {
				source.value = clamp(next, resolveValue(min), resolveValue(max));
			},
		});
	}

	return readonly(
		computed(() =>
			clamp(resolveValue(value), resolveValue(min), resolveValue(max)),
		),
	);
}
