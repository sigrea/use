import { computed, readonly } from "@sigrea/core";

import { resolveValue } from "../../shared/resolveValue";
import type { MaybeValue, UseSumReturn } from "../types";

type UseSumArrayInput = MaybeValue<readonly MaybeValue<number>[]>;
type UseSumArgs = MaybeValue<number>[] | [UseSumArrayInput];

function resolveSumArgs(args: UseSumArgs): number[] {
	return args.flatMap((arg: MaybeValue<number> | UseSumArrayInput) => {
		const value = resolveValue(arg);
		if (Array.isArray(value)) {
			return value.map((entry) => resolveValue(entry));
		}

		return [value];
	});
}

/**
 * Reactively get the sum of resolved numbers.
 */
export function useSum(
	array: MaybeValue<readonly MaybeValue<number>[]>,
): UseSumReturn;
export function useSum(...args: MaybeValue<number>[]): UseSumReturn;
export function useSum(...args: UseSumArgs): UseSumReturn {
	return readonly(
		computed(() => {
			const array = resolveSumArgs(args);
			return array.reduce((sum, value) => sum + value, 0);
		}),
	);
}
