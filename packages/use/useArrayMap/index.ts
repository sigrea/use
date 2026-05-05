import { computed, readonly } from "@sigrea/core";

import { resolveValue } from "../../shared/resolveValue";
import type {
	MaybeValue,
	UseArrayMapCallback,
	UseArrayMapReturn,
} from "../types";

/**
 * Reactive `Array.map`.
 *
 * @param list Source array.
 * @param callback Function that maps each resolved element.
 */
export function useArrayMap<T, U = T>(
	list: MaybeValue<readonly MaybeValue<T>[]>,
	callback: UseArrayMapCallback<T, U>,
): UseArrayMapReturn<U> {
	return readonly(
		computed(() => {
			const resolvedList = resolveValue(list).map((element) =>
				resolveValue(element),
			);

			return resolvedList.map(callback);
		}),
	);
}
