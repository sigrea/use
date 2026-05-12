import { computed, readonly } from "@sigrea/core";

import { resolveValue } from "../../shared/resolveValue";
import type {
	MaybeValue,
	UseArrayUniqueCompareFn,
	UseArrayUniqueReturn,
} from "../types";

function unique<T>(array: readonly T[]): T[] {
	return Array.from(new Set(array));
}

function uniqueElementsBy<T>(
	array: T[],
	compareFn: UseArrayUniqueCompareFn<T>,
): T[] {
	return array.reduce<T[]>((result, value) => {
		if (
			!result.some((existingValue) => compareFn(value, existingValue, array))
		) {
			result.push(value);
		}

		return result;
	}, []);
}

/**
 * Reactive unique array.
 *
 * @param list Source array.
 * @param compareFn Custom comparison function.
 */
export function useArrayUnique<T>(
	list: MaybeValue<readonly MaybeValue<T>[]>,
	compareFn?: UseArrayUniqueCompareFn<T>,
): UseArrayUniqueReturn<T> {
	return readonly(
		computed(() => {
			const resolvedList = resolveValue(list).map((element) =>
				resolveValue(element),
			);

			return compareFn
				? uniqueElementsBy(resolvedList, compareFn)
				: unique(resolvedList);
		}),
	);
}
