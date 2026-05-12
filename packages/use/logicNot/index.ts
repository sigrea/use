import { computed, readonly } from "@sigrea/core";

import { resolveValue } from "../../shared/resolveValue";
import type { LogicNotReturn, MaybeValue } from "../types";

/**
 * Reactive `NOT` for a resolved value.
 */
export function logicNot(value: MaybeValue<unknown>): LogicNotReturn {
	return readonly(computed(() => !resolveValue(value)));
}
