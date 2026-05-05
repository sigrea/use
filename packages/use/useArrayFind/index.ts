import { computed, readonly } from "@sigrea/core";

import { resolveValue } from "../../shared/resolveValue";
import type {
	MaybeValue,
	UseArrayFindPredicate,
	UseArrayFindReturn,
} from "../types";

/**
 * Reactive `Array.find`.
 *
 * @param list Source array.
 * @param predicate Function to test each resolved element.
 */
export function useArrayFind<T, S extends T>(
	list: MaybeValue<readonly MaybeValue<T>[]>,
	predicate: (
		element: T,
		index: number,
		array: readonly MaybeValue<T>[],
	) => element is S,
): UseArrayFindReturn<S>;
/**
 * Reactive `Array.find`.
 *
 * @param list Source array.
 * @param predicate Function to test each resolved element.
 */
export function useArrayFind<T>(
	list: MaybeValue<readonly MaybeValue<T>[]>,
	predicate: UseArrayFindPredicate<T>,
): UseArrayFindReturn<T>;
export function useArrayFind<T>(
	list: MaybeValue<readonly MaybeValue<T>[]>,
	predicate: UseArrayFindPredicate<T>,
): UseArrayFindReturn<T> {
	return readonly(
		computed(() => {
			const found = resolveValue(list).find((element, index, array) =>
				predicate(resolveValue(element), index, array),
			);

			return found === undefined ? undefined : resolveValue(found);
		}),
	);
}
