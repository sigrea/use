import { readonly, signal, watch } from "@sigrea/core";

import { defaultWindow, listen, resolveTarget } from "../../shared";
import { tryOnScopeDispose } from "../tryOnScopeDispose";
import type {
	MaybeTarget,
	UseWindowFocusOptions,
	UseWindowFocusReturn,
	UseWindowFocusWindowLike,
} from "../types";

function readFocused(
	windowValue: UseWindowFocusWindowLike | null | undefined,
): boolean {
	return windowValue?.document?.hasFocus?.() ?? false;
}

export function useWindowFocus<
	TWindow extends UseWindowFocusWindowLike = UseWindowFocusWindowLike,
>(options: UseWindowFocusOptions<TWindow> = {}): UseWindowFocusReturn {
	const windowTarget =
		"window" in options && options.window !== undefined
			? options.window
			: (defaultWindow as MaybeTarget<TWindow | null | undefined> | undefined);
	const initialWindow =
		windowTarget === undefined
			? undefined
			: resolveTarget<TWindow | null | undefined>(windowTarget);
	const focused = signal(readFocused(initialWindow));
	let stopped = false;

	const stopWatch = watch(
		() =>
			windowTarget === undefined
				? undefined
				: resolveTarget<TWindow | null | undefined>(windowTarget),
		(nextWindow, _previousWindow, onCleanup) => {
			focused.value = readFocused(nextWindow);

			if (nextWindow === undefined || nextWindow === null) {
				return;
			}

			const cleanups = [
				listen(
					nextWindow,
					"blur",
					() => {
						focused.value = false;
					},
					{ passive: true },
				),
				listen(
					nextWindow,
					"focus",
					() => {
						focused.value = true;
					},
					{ passive: true },
				),
			];

			onCleanup(() => {
				for (const cleanup of cleanups) {
					cleanup();
				}
			});
		},
		{ immediate: true, flush: "sync" },
	);

	const stop = () => {
		if (stopped) {
			return;
		}

		stopped = true;
		stopWatch();
	};

	tryOnScopeDispose(stop);

	return {
		focused: readonly(focused),
		stop,
	};
}
