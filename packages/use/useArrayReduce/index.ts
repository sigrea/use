import { computed, readonly } from "@sigrea/core";

import { resolveValue } from "../../shared/resolveValue";
import type {
	MaybeValue,
	UseArrayReduceReducer,
	UseArrayReduceReturn,
} from "../types";

function resolveAccumulator<T>(value: T): T {
	return resolveValue(value as MaybeValue<T>) as T;
}

function resolveInitialValue<T>(value: MaybeValue<T>): T {
	if (typeof value === "function") {
		return resolveValue((value as () => MaybeValue<T>)());
	}

	return resolveValue(value);
}

/**
 * Reactive `Array.reduce`.
 *
 * @param list Source array.
 * @param reducer Function to reduce each resolved element.
 */
export function useArrayReduce<T>(
	list: MaybeValue<readonly MaybeValue<T>[]>,
	reducer: UseArrayReduceReducer<T, T, T>,
): UseArrayReduceReturn<T>;
/**
 * Reactive `Array.reduce`.
 *
 * @param list Source array.
 * @param reducer Function to reduce each resolved element.
 * @param initialValue Initial accumulator value.
 */
export function useArrayReduce<T, U>(
	list: MaybeValue<readonly MaybeValue<T>[]>,
	reducer: UseArrayReduceReducer<U, T, U>,
	initialValue: MaybeValue<U>,
): UseArrayReduceReturn<U>;
export function useArrayReduce<T, U>(
	list: MaybeValue<readonly MaybeValue<T>[]>,
	reducer: UseArrayReduceReducer<U | T, T, U | T>,
	...args: [] | [MaybeValue<U>]
): UseArrayReduceReturn<U | T> {
	return readonly(
		computed(() => {
			const resolvedList = resolveValue(list);
			const reduce = (
				previousValue: unknown,
				currentValue: unknown,
				index: number,
			) =>
				reducer(
					resolveAccumulator(previousValue as U | T),
					resolveValue(currentValue as MaybeValue<T>),
					index,
				);

			if (args.length > 0) {
				return resolvedList.reduce<unknown>(
					reduce,
					resolveInitialValue(args[0]),
				) as U | T;
			}

			return (resolvedList as readonly unknown[]).reduce(
				(previousValue, currentValue, index) =>
					reduce(previousValue, currentValue, index),
			) as U | T;
		}),
	);
}
