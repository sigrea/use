import { computed, readonly } from "@sigrea/core";

import { resolveValue } from "../../shared/resolveValue";
import type { MaybeValue, UseFloorReturn } from "../types";

/**
 * Reactive `Math.floor`.
 */
export function useFloor(value: MaybeValue<number>): UseFloorReturn {
	return readonly(computed(() => Math.floor(resolveValue(value))));
}
