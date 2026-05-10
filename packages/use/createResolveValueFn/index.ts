import { resolveValue } from "../../shared/resolveValue";

import type { MaybeValueArgs, ResolveValueFn } from "../types";

type WrappedFunction<TThis, TArgs extends unknown[], TReturn> = (
	this: TThis,
	...args: TArgs
) => TReturn;

export function createResolveValueFn<TThis, TArgs extends unknown[], TReturn>(
	fn: WrappedFunction<TThis, TArgs, TReturn>,
): ResolveValueFn<WrappedFunction<TThis, TArgs, TReturn>> {
	return function (this: TThis, ...args: MaybeValueArgs<TArgs>) {
		return fn.apply(this, args.map((arg) => resolveValue(arg)) as TArgs);
	} as ResolveValueFn<WrappedFunction<TThis, TArgs, TReturn>>;
}
