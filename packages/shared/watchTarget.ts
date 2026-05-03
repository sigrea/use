import type { Cleanup, WatchOptions, WatchStopHandle } from "@sigrea/core";
import { watch } from "@sigrea/core";

import { resolveTarget } from "./resolveTarget";
import type { MaybeTarget, ResolvedTarget } from "./types";

export type WatchTargetCallback<TTarget> = (
	target: ResolvedTarget<TTarget>,
) => void | Cleanup | Promise<void | Cleanup>;

export type WatchTargetOptions = Omit<WatchOptions, "deep">;

const defaultWatchTargetOptions: WatchTargetOptions = {
	flush: "sync",
	immediate: true,
};

export function watchTarget<TTarget>(
	target: MaybeTarget<TTarget>,
	register: WatchTargetCallback<TTarget>,
	options?: WatchTargetOptions,
): WatchStopHandle {
	return watch(
		() => resolveTarget(target),
		(nextTarget) => {
			if (nextTarget === undefined) {
				return;
			}

			return register(nextTarget);
		},
		{
			...defaultWatchTargetOptions,
			...options,
		},
	);
}
