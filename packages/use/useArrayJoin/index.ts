import { computed, readonly } from "@sigrea/core";

import { resolveValue } from "../../shared/resolveValue";
import type { MaybeValue, UseArrayJoinReturn } from "../types";

/**
 * Reactive `Array.join`.
 *
 * @param list Source array.
 * @param separator String used to separate adjacent elements.
 */
export function useArrayJoin(
	list: MaybeValue<readonly unknown[]>,
	separator?: MaybeValue<string | undefined>,
): UseArrayJoinReturn {
	return readonly(
		computed(() =>
			resolveValue(list)
				.map((element) => resolveValue(element as MaybeValue<unknown>))
				.join(resolveValue(separator)),
		),
	);
}
