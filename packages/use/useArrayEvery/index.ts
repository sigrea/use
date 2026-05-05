import { computed, readonly } from "@sigrea/core";

import { resolveValue } from "../../shared/resolveValue";
import type {
	MaybeValue,
	UseArrayEveryPredicate,
	UseArrayEveryReturn,
} from "../types";

/**
 * Reactive `Array.every`.
 *
 * @param list Source array.
 * @param predicate Function to test each resolved element.
 */
export function useArrayEvery<T>(
	list: MaybeValue<readonly MaybeValue<T>[]>,
	predicate: UseArrayEveryPredicate<T>,
): UseArrayEveryReturn {
	return readonly(
		computed(() => {
			const resolvedList = resolveValue(list);

			return resolvedList.every((element, index, array) =>
				predicate(resolveValue(element), index, array),
			);
		}),
	);
}
