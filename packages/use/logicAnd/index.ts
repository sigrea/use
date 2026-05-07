import { computed, readonly } from "@sigrea/core";

import { resolveValue } from "../../shared/resolveValue";
import type { LogicAndReturn, MaybeValue } from "../types";

/**
 * Reactive `AND` for resolved values.
 */
export function logicAnd(...args: MaybeValue<unknown>[]): LogicAndReturn {
	return readonly(
		computed(() => args.every((arg) => Boolean(resolveValue(arg)))),
	);
}
