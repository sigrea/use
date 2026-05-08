import { computed, readonly } from "@sigrea/core";

import { resolveValue } from "../../shared/resolveValue";
import type {
	MaybeValue,
	UseArrayIncludesComparatorFn,
	UseArrayIncludesOptions,
	UseArrayIncludesReturn,
} from "../types";

function isOptions<T, V>(
	value: unknown,
): value is UseArrayIncludesOptions<T, V> {
	return typeof value === "object" && value !== null;
}

function defaultComparator<T, V>(element: T, value: V): boolean {
	return element === (value as unknown as T) || Object.is(element, value);
}

function createComparator<T, V>(
	comparator: UseArrayIncludesComparatorFn<T, V> | keyof T | undefined,
): UseArrayIncludesComparatorFn<T, V> {
	if (typeof comparator === "function") {
		return comparator;
	}

	if (comparator !== undefined) {
		return (element, value) => element[comparator] === value;
	}

	return defaultComparator;
}

function includesWithDefaultComparator<T, V>(
	list: readonly MaybeValue<T>[],
	value: V,
): boolean {
	for (let index = 0; index < list.length; index += 1) {
		if (defaultComparator(resolveValue(list[index]), value)) {
			return true;
		}
	}

	return false;
}

/**
 * Reactive `Array.includes`.
 *
 * @param list Source array.
 * @param value Value to search for.
 */
export function useArrayIncludes<T>(
	list: MaybeValue<readonly MaybeValue<T>[]>,
	value: MaybeValue<T>,
): UseArrayIncludesReturn;
/**
 * Reactive `Array.includes`.
 *
 * @param list Source array.
 * @param value Value to compare with the selected key.
 * @param key Object key used for comparison.
 */
export function useArrayIncludes<T, K extends keyof T>(
	list: MaybeValue<readonly MaybeValue<T>[]>,
	value: MaybeValue<T[K]>,
	key: K,
): UseArrayIncludesReturn;
/**
 * Reactive `Array.includes`.
 *
 * @param list Source array.
 * @param value Value to compare with each resolved element.
 * @param comparator Custom comparison function.
 */
export function useArrayIncludes<T, V>(
	list: MaybeValue<readonly MaybeValue<T>[]>,
	value: MaybeValue<V>,
	comparator: UseArrayIncludesComparatorFn<T, V>,
): UseArrayIncludesReturn;
/**
 * Reactive `Array.includes`.
 *
 * @param list Source array.
 * @param value Value to compare with the selected key.
 * @param options Includes options.
 */
export function useArrayIncludes<T, K extends keyof T>(
	list: MaybeValue<readonly MaybeValue<T>[]>,
	value: MaybeValue<T[K]>,
	options: UseArrayIncludesOptions<T, T[K]> & { comparator: K },
): UseArrayIncludesReturn;
/**
 * Reactive `Array.includes`.
 *
 * @param list Source array.
 * @param value Value to search for.
 * @param options Includes options.
 */
export function useArrayIncludes<T>(
	list: MaybeValue<readonly MaybeValue<T>[]>,
	value: MaybeValue<T>,
	options: UseArrayIncludesOptions<T, T> & { comparator?: undefined },
): UseArrayIncludesReturn;
/**
 * Reactive `Array.includes`.
 *
 * @param list Source array.
 * @param value Value to compare with each resolved element.
 * @param options Includes options.
 */
export function useArrayIncludes<T, V>(
	list: MaybeValue<readonly MaybeValue<T>[]>,
	value: MaybeValue<V>,
	options: UseArrayIncludesOptions<T, V> & {
		comparator: UseArrayIncludesComparatorFn<T, V>;
	},
): UseArrayIncludesReturn;
/**
 * Reactive `Array.includes`.
 *
 * @param list Source array.
 * @param value Value to search for.
 * @param options Includes options.
 */
export function useArrayIncludes<T, V>(
	list: MaybeValue<readonly MaybeValue<T>[]>,
	value: MaybeValue<V>,
	options: UseArrayIncludesOptions<T, V>,
): UseArrayIncludesReturn;
export function useArrayIncludes<T, V>(
	list: MaybeValue<readonly MaybeValue<T>[]>,
	value: MaybeValue<V>,
	comparatorOrOptions?:
		| UseArrayIncludesComparatorFn<T, V>
		| keyof T
		| UseArrayIncludesOptions<T, V>,
): UseArrayIncludesReturn {
	const options = isOptions<T, V>(comparatorOrOptions)
		? comparatorOrOptions
		: undefined;
	const rawComparator =
		options === undefined ? comparatorOrOptions : options.comparator;
	const comparator = createComparator(
		rawComparator as UseArrayIncludesComparatorFn<T, V> | keyof T | undefined,
	);

	return readonly(
		computed(() => {
			const resolvedValue = resolveValue(value);
			const fromIndex =
				options?.fromIndex === undefined ? 0 : resolveValue(options.fromIndex);
			const slicedList = resolveValue(list).slice(fromIndex);

			if (rawComparator === undefined) {
				return includesWithDefaultComparator(slicedList, resolvedValue);
			}

			return slicedList.some((element, index, array) =>
				comparator(resolveValue(element), resolvedValue, index, array),
			);
		}),
	);
}
