import { computed, readonly } from "@sigrea/core";

import { resolveValue } from "../../shared/resolveValue";
import type { MaybeValue, UseAbsReturn } from "../types";

/**
 * Reactive `Math.abs`.
 */
export function useAbs(value: MaybeValue<number>): UseAbsReturn {
	return readonly(computed(() => Math.abs(resolveValue(value))));
}
