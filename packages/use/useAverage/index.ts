import { computed, readonly } from "@sigrea/core";

import { resolveValue } from "../../shared/resolveValue";
import type { MaybeValue, UseAverageReturn } from "../types";

type UseAverageArrayInput = MaybeValue<readonly MaybeValue<number>[]>;
type UseAverageArgs = MaybeValue<number>[] | [UseAverageArrayInput];

function resolveAverageArgs(args: UseAverageArgs): number[] {
	return args.flatMap((arg: MaybeValue<number> | UseAverageArrayInput) => {
		const value = resolveValue(arg);
		if (Array.isArray(value)) {
			return value.map((entry) => resolveValue(entry));
		}

		return [value];
	});
}

/**
 * Reactive average of resolved numbers.
 */
export function useAverage(
	array: MaybeValue<readonly MaybeValue<number>[]>,
): UseAverageReturn;
export function useAverage(...args: MaybeValue<number>[]): UseAverageReturn;
export function useAverage(...args: UseAverageArgs): UseAverageReturn {
	return readonly(
		computed(() => {
			const array = resolveAverageArgs(args);
			return array.reduce((sum, value) => sum + value, 0) / array.length;
		}),
	);
}
