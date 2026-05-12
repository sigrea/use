import { computed, readonly } from "@sigrea/core";

import { resolveValue } from "../../shared/resolveValue";
import type {
	MaybeValue,
	UseArrayFindIndexPredicate,
	UseArrayFindIndexReturn,
} from "../types";

/**
 * Reactive `Array.findIndex`.
 *
 * @param list Source array.
 * @param predicate Function to test each resolved element.
 */
export function useArrayFindIndex<T>(
	list: MaybeValue<readonly MaybeValue<T>[]>,
	predicate: UseArrayFindIndexPredicate<T>,
): UseArrayFindIndexReturn {
	return readonly(
		computed(() =>
			resolveValue(list).findIndex((element, index, array) =>
				predicate(resolveValue(element), index, array),
			),
		),
	);
}
