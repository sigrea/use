import { computed, readonly } from "@sigrea/core";

import { resolveValue } from "../../shared/resolveValue";
import type { LogicAndReturn } from "../types";

type LogicAndSource<T> = T extends (...args: infer Args) => unknown
	? Args extends []
		? T
		: never
	: T;

/**
 * Reactive `AND` for resolved values.
 */
export function logicAnd<TArgs extends readonly unknown[]>(
	...args: { [K in keyof TArgs]: LogicAndSource<TArgs[K]> }
): LogicAndReturn {
	return readonly(
		computed(() => args.every((arg) => Boolean(resolveValue(arg as never)))),
	);
}
