import { computed, readonly } from "@sigrea/core";

import { resolveValue } from "../../shared/resolveValue";
import type { MaybeValue, UseRoundReturn } from "../types";

/**
 * Reactive `Math.round`.
 */
export function useRound(value: MaybeValue<number>): UseRoundReturn {
	return readonly(computed(() => Math.round(resolveValue(value))));
}
