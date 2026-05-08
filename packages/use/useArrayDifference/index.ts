import { computed, readonly } from "@sigrea/core";

import { resolveValue } from "../../shared/resolveValue";
import type {
	MaybeValue,
	UseArrayDifferenceCompareFn,
	UseArrayDifferenceOptions,
	UseArrayDifferenceReturn,
} from "../types";

function defaultCompare<T>(value: T, otherValue: T) {
	return value === otherValue || Object.is(value, otherValue);
}

function createCompare<T>(
	compare: keyof T | UseArrayDifferenceCompareFn<T> | undefined,
): UseArrayDifferenceCompareFn<T> {
	if (typeof compare === "function") {
		return compare;
	}

	if (compare !== undefined) {
		return (value, otherValue) => value[compare] === otherValue[compare];
	}

	return defaultCompare;
}

function difference<T>(
	list: readonly T[],
	values: readonly T[],
	compare: UseArrayDifferenceCompareFn<T>,
) {
	return list.filter(
		(value) =>
			values.findIndex((otherValue) => compare(value, otherValue)) === -1,
	);
}

/**
 * Reactive array difference.
 *
 * @param list Source array.
 * @param values Values to remove from the source array.
 * @param key Object key used for comparison.
 * @param options Difference options.
 */
export function useArrayDifference<T>(
	list: MaybeValue<readonly T[]>,
	values: MaybeValue<readonly T[]>,
	key: keyof T,
	options?: UseArrayDifferenceOptions,
): UseArrayDifferenceReturn<T>;
/**
 * Reactive array difference.
 *
 * @param list Source array.
 * @param values Values to remove from the source array.
 * @param compareFn Custom comparison function.
 * @param options Difference options.
 */
export function useArrayDifference<T>(
	list: MaybeValue<readonly T[]>,
	values: MaybeValue<readonly T[]>,
	compareFn?: UseArrayDifferenceCompareFn<T>,
	options?: UseArrayDifferenceOptions,
): UseArrayDifferenceReturn<T>;
export function useArrayDifference<T>(
	list: MaybeValue<readonly T[]>,
	values: MaybeValue<readonly T[]>,
	compare?: keyof T | UseArrayDifferenceCompareFn<T>,
	options: UseArrayDifferenceOptions = {},
): UseArrayDifferenceReturn<T> {
	const compareFn = createCompare(compare);

	return readonly(
		computed(() => {
			const resolvedList = resolveValue(list);
			const resolvedValues = resolveValue(values);
			const firstDifference = difference(
				resolvedList,
				resolvedValues,
				compareFn,
			);

			if (!options.symmetric) {
				return firstDifference;
			}

			return [
				...firstDifference,
				...difference(resolvedValues, resolvedList, compareFn),
			];
		}),
	);
}
