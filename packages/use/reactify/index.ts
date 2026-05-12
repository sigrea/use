import { computed, readonly } from "@sigrea/core";

import { resolveValue } from "../../shared/resolveValue";

import type { MaybeValueArgs, ReactifyReturn } from "../types";

type WrappedFunction<TThis, TArgs extends unknown[], TReturn> = (
	this: TThis,
	...args: TArgs
) => TReturn;

export function reactify<TThis, TArgs extends unknown[], TReturn>(
	fn: WrappedFunction<TThis, TArgs, TReturn>,
): ReactifyReturn<WrappedFunction<TThis, TArgs, TReturn>> {
	return function (this: TThis, ...args: MaybeValueArgs<TArgs>) {
		return readonly(
			computed(() =>
				fn.apply(this, args.map((arg) => resolveValue(arg)) as TArgs),
			),
		);
	} as ReactifyReturn<WrappedFunction<TThis, TArgs, TReturn>>;
}
