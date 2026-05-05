import { computed, readonly } from "@sigrea/core";

import { resolveValue } from "../../shared/resolveValue";
import type {
	MaybeValue,
	UseArraySomePredicate,
	UseArraySomeReturn,
} from "../types";

/**
 * Reactive `Array.some`.
 *
 * @param list Source array.
 * @param predicate Function to test each resolved element.
 */
export function useArraySome<T>(
	list: MaybeValue<readonly MaybeValue<T>[]>,
	predicate: UseArraySomePredicate<T>,
): UseArraySomeReturn {
	return readonly(
		computed(() => {
			const resolvedList = resolveValue(list);

			return resolvedList.some((element, index, array) =>
				predicate(resolveValue(element), index, array),
			);
		}),
	);
}
