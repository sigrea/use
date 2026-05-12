import { computed, readonly } from "@sigrea/core";

import { resolveValue } from "../../shared/resolveValue";
import type {
	MaybeValue,
	UseArrayFilterPredicate,
	UseArrayFilterReturn,
} from "../types";

/**
 * Reactive `Array.filter`.
 *
 * @param list Source array.
 * @param predicate Function to test each resolved element.
 */
export function useArrayFilter<T, S extends T>(
	list: MaybeValue<readonly MaybeValue<T>[]>,
	predicate: (element: T, index: number, array: T[]) => element is S,
): UseArrayFilterReturn<S>;
/**
 * Reactive `Array.filter`.
 *
 * @param list Source array.
 * @param predicate Function to test each resolved element.
 */
export function useArrayFilter<T>(
	list: MaybeValue<readonly MaybeValue<T>[]>,
	predicate: UseArrayFilterPredicate<T>,
): UseArrayFilterReturn<T>;
export function useArrayFilter<T>(
	list: MaybeValue<readonly MaybeValue<T>[]>,
	predicate: UseArrayFilterPredicate<T>,
): UseArrayFilterReturn<T> {
	return readonly(
		computed(() => {
			const resolvedList = resolveValue(list).map((element) =>
				resolveValue(element),
			);

			return resolvedList.filter(predicate);
		}),
	);
}
