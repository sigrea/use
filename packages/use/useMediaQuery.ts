import { readonly, signal, watch } from "@sigrea/core";
import {
	defaultWindow,
	resolveTarget,
	resolveValue,
	watchMediaQuery,
} from "../shared";

import type {
	MatchMediaWindow,
	MaybeTarget,
	MaybeValue,
	UseMediaQueryOptions,
	UseMediaQueryReturn,
	WindowLike,
} from "./types";

export function useMediaQuery<
	TWindow extends MatchMediaWindow = WindowLike & MatchMediaWindow,
>(
	query: MaybeValue<string>,
	options: UseMediaQueryOptions<TWindow> = {},
): UseMediaQueryReturn {
	const { initialValue = false, ...watchOptions } = options;
	const fallbackMatches = initialValue;
	const windowTarget =
		watchOptions.window ?? (defaultWindow as MaybeTarget<TWindow> | undefined);
	const initialWindow =
		windowTarget === undefined
			? undefined
			: resolveTarget<TWindow>(windowTarget);
	const initialQuery = resolveValue(query);
	const initialMatches =
		initialWindow && typeof initialWindow.matchMedia === "function"
			? initialWindow.matchMedia(initialQuery).matches
			: fallbackMatches;
	const matches = signal(initialMatches);
	const stop = watch(
		() => {
			const currentWindow =
				windowTarget === undefined
					? undefined
					: resolveTarget<TWindow>(windowTarget);

			return {
				query: resolveValue(query),
				window: currentWindow,
			};
		},
		(nextValue, _previousValue, onCleanup) => {
			if (nextValue.window === undefined || nextValue.window === null) {
				matches.value = fallbackMatches;
				return;
			}

			matches.value = nextValue.window.matchMedia(nextValue.query).matches;

			const stopWatching = watchMediaQuery(
				nextValue.query,
				(nextMatches) => {
					matches.value = nextMatches;
				},
				{ window: nextValue.window },
			);
			onCleanup(stopWatching);
		},
		{ immediate: true, flush: "sync" },
	);

	return {
		matches: readonly(matches),
		stop,
	};
}
