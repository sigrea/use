import { computed, readonly } from "@sigrea/core";

import { resolveValue } from "../../shared/resolveValue";
import type {
	MaybeValue,
	UseArrayFindLastPredicate,
	UseArrayFindLastReturn,
} from "../types";

function findLast<T>(
	list: readonly MaybeValue<T>[],
	predicate: UseArrayFindLastPredicate<T>,
): MaybeValue<T> | undefined {
	let index = list.length;

	while (index-- > 0) {
		const element = list[index];

		if (predicate(resolveValue(element), index, list)) {
			return element;
		}
	}

	return undefined;
}

/**
 * Reactive `Array.findLast`.
 *
 * @param list Source array.
 * @param predicate Function to test each resolved element.
 */
export function useArrayFindLast<T, S extends T>(
	list: MaybeValue<readonly MaybeValue<T>[]>,
	predicate: (
		element: T,
		index: number,
		array: readonly MaybeValue<T>[],
	) => element is S,
): UseArrayFindLastReturn<S>;
/**
 * Reactive `Array.findLast`.
 *
 * @param list Source array.
 * @param predicate Function to test each resolved element.
 */
export function useArrayFindLast<T>(
	list: MaybeValue<readonly MaybeValue<T>[]>,
	predicate: UseArrayFindLastPredicate<T>,
): UseArrayFindLastReturn<T>;
export function useArrayFindLast<T>(
	list: MaybeValue<readonly MaybeValue<T>[]>,
	predicate: UseArrayFindLastPredicate<T>,
): UseArrayFindLastReturn<T> {
	return readonly(
		computed(() => {
			const found = findLast(resolveValue(list), predicate);

			return found === undefined ? undefined : resolveValue(found);
		}),
	);
}
