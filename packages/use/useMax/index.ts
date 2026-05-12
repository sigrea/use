import { computed, readonly } from "@sigrea/core";

import { resolveValue } from "../../shared/resolveValue";
import type { MaybeValue, UseMaxReturn } from "../types";

type UseMaxArrayInput = MaybeValue<readonly MaybeValue<number>[]>;
type UseMaxArgs = MaybeValue<number>[] | [UseMaxArrayInput];

function resolveMaxArgs(args: UseMaxArgs): number[] {
	return args.flatMap((arg: MaybeValue<number> | UseMaxArrayInput) => {
		const value = resolveValue(arg);
		if (Array.isArray(value)) {
			return value.map((entry) => resolveValue(entry));
		}

		return [value];
	});
}

/**
 * Reactively get the maximum of resolved numbers.
 */
export function useMax(
	array: MaybeValue<readonly MaybeValue<number>[]>,
): UseMaxReturn;
export function useMax(...args: MaybeValue<number>[]): UseMaxReturn;
export function useMax(...args: UseMaxArgs): UseMaxReturn {
	return readonly(
		computed(() => {
			const array = resolveMaxArgs(args);
			return Math.max(...array);
		}),
	);
}
