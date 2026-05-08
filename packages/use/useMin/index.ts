import { computed, readonly } from "@sigrea/core";

import { resolveValue } from "../../shared/resolveValue";
import type { MaybeValue, UseMinReturn } from "../types";

type UseMinArrayInput = MaybeValue<readonly MaybeValue<number>[]>;
type UseMinArgs = MaybeValue<number>[] | [UseMinArrayInput];

function resolveMinArgs(args: UseMinArgs): number[] {
	return args.flatMap((arg: MaybeValue<number> | UseMinArrayInput) => {
		const value = resolveValue(arg);
		if (Array.isArray(value)) {
			return value.map((entry) => resolveValue(entry));
		}

		return [value];
	});
}

/**
 * Reactively get the minimum of resolved numbers.
 */
export function useMin(
	array: MaybeValue<readonly MaybeValue<number>[]>,
): UseMinReturn;
export function useMin(...args: MaybeValue<number>[]): UseMinReturn;
export function useMin(...args: UseMinArgs): UseMinReturn {
	return readonly(
		computed(() => {
			const array = resolveMinArgs(args);
			return Math.min(...array);
		}),
	);
}
