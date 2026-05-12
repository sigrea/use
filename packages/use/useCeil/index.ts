import { computed, readonly } from "@sigrea/core";

import { resolveValue } from "../../shared/resolveValue";
import type { MaybeValue, UseCeilReturn } from "../types";

/**
 * Reactive `Math.ceil`.
 */
export function useCeil(value: MaybeValue<number>): UseCeilReturn {
	return readonly(computed(() => Math.ceil(resolveValue(value))));
}
