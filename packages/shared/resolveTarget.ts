import { resolveValue } from "./resolveValue";
import type { MaybeTarget, ResolvedTarget } from "./types";

export function resolveTarget<TTarget>(
	target: MaybeTarget<TTarget>,
): ResolvedTarget<TTarget> | undefined {
	return (resolveValue(target) ?? undefined) as
		| ResolvedTarget<TTarget>
		| undefined;
}
