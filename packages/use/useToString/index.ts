import { computed, readonly } from "@sigrea/core";

import { resolveValue } from "../../shared/resolveValue";
import type { MaybeValue, UseToStringReturn } from "../types";

/**
 * Reactively convert a value to string.
 */
export function useToString(value: MaybeValue<unknown>): UseToStringReturn {
	return readonly(computed(() => `${resolveValue(value)}`));
}
