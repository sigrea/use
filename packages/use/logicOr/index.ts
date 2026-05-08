import { computed, readonly } from "@sigrea/core";

import { resolveValue } from "../../shared/resolveValue";
import type { LogicOrReturn, MaybeValue } from "../types";

/**
 * Reactive `OR` for resolved values.
 */
export function logicOr(...args: MaybeValue<unknown>[]): LogicOrReturn {
	return readonly(
		computed(() => args.some((arg) => Boolean(resolveValue(arg)))),
	);
}
