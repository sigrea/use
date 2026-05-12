import { computed, readonly } from "@sigrea/core";

import { resolveValue } from "../../shared/resolveValue";
import type { MaybeValue, UseTruncReturn } from "../types";

/**
 * Reactive `Math.trunc`.
 */
export function useTrunc(value: MaybeValue<number>): UseTruncReturn {
	return readonly(computed(() => Math.trunc(resolveValue(value))));
}
