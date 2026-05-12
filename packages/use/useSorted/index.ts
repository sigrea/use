import { computed, readonly } from "@sigrea/core";

import { resolveValue } from "../../shared/resolveValue";
import type {
	MaybeValue,
	UseSortedCompareFn,
	UseSortedOptions,
	UseSortedReturn,
	UseSortedSortFn,
} from "../types";

const defaultCompare: UseSortedCompareFn<number> = (value, otherValue) =>
	value - otherValue;

function defaultSort<T>(list: T[], compareFn: UseSortedCompareFn<T>): T[] {
	return list.sort(compareFn);
}

function isOptions<T>(
	value: UseSortedCompareFn<T> | UseSortedOptions<T> | undefined,
): value is UseSortedOptions<T> {
	return typeof value === "object" && value !== null;
}

function resolveElements<T>(list: readonly MaybeValue<T>[]): T[] {
	return list.map((element) => resolveValue(element));
}

/**
 * Reactive sorted array.
 */
export function useSorted<T>(
	list: MaybeValue<readonly MaybeValue<T>[]>,
	options?: UseSortedOptions<T>,
): UseSortedReturn<T>;
export function useSorted<T>(
	list: MaybeValue<readonly MaybeValue<T>[]>,
	compareFn?: UseSortedCompareFn<T>,
	options?: Omit<UseSortedOptions<T>, "compareFn">,
): UseSortedReturn<T>;
export function useSorted<T>(
	list: MaybeValue<readonly MaybeValue<T>[]>,
	compareOrOptions?: UseSortedCompareFn<T> | UseSortedOptions<T>,
	options: Omit<UseSortedOptions<T>, "compareFn"> = {},
): UseSortedReturn<T> {
	const resolvedOptions = isOptions(compareOrOptions)
		? compareOrOptions
		: options;
	const compareFn =
		(isOptions(compareOrOptions)
			? compareOrOptions.compareFn
			: compareOrOptions) ??
		(defaultCompare as unknown as UseSortedCompareFn<T>);
	const sortFn: UseSortedSortFn<T> = resolvedOptions.sortFn ?? defaultSort;

	return readonly(
		computed(() => {
			const resolvedList = resolveElements(resolveValue(list));

			return sortFn([...resolvedList], compareFn);
		}),
	);
}
