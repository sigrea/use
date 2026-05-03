import { readonly, signal, watch } from "@sigrea/core";
import {
	defaultWindow,
	resolveTarget,
	resolveValue,
	watchMediaQuery,
} from "../../shared";

import type {
	MatchMediaWindow,
	MaybeTarget,
	MaybeValue,
	UseMediaQueryOptions,
	UseMediaQueryReturn,
	WindowLike,
} from "../types";

function pxValue(value: string): number {
	return value.trim().endsWith("rem")
		? Number.parseFloat(value) * 16
		: Number.parseFloat(value);
}

function resolveSsrMediaQuery(
	query: string,
	ssrWidth?: number,
): boolean | undefined {
	if (typeof ssrWidth !== "number") {
		return undefined;
	}

	let hasWidthQuery = false;
	let hasMatchingQuery = false;
	for (const queryString of query.split(",")) {
		const not = queryString.includes("not all");
		const minWidth = queryString.match(
			/\(\s*min-width:\s*(-?\d+(?:\.\d*)?[a-z]+\s*)\)/,
		);
		const maxWidth = queryString.match(
			/\(\s*max-width:\s*(-?\d+(?:\.\d*)?[a-z]+\s*)\)/,
		);
		if (!minWidth && !maxWidth) {
			continue;
		}

		hasWidthQuery = true;
		let matches = Boolean(minWidth || maxWidth);
		if (minWidth && matches) {
			matches = ssrWidth >= pxValue(minWidth[1]);
		}
		if (maxWidth && matches) {
			matches = ssrWidth <= pxValue(maxWidth[1]);
		}
		if (not ? !matches : matches) {
			hasMatchingQuery = true;
			break;
		}
	}

	return hasWidthQuery ? hasMatchingQuery : undefined;
}

export function useMediaQuery<
	TWindow extends MatchMediaWindow = WindowLike & MatchMediaWindow,
>(
	query: MaybeValue<string>,
	options: UseMediaQueryOptions<TWindow> = {},
): UseMediaQueryReturn {
	const { initialValue = false, ssrWidth, ...watchOptions } = options;
	const resolveFallbackMatches = (currentQuery: string) =>
		resolveSsrMediaQuery(currentQuery, ssrWidth) ?? initialValue;
	const windowTarget =
		"window" in watchOptions && watchOptions.window !== undefined
			? watchOptions.window
			: (defaultWindow as MaybeTarget<TWindow> | undefined);
	const initialWindow =
		windowTarget === undefined
			? undefined
			: resolveTarget<TWindow>(windowTarget);
	const initialQuery = resolveValue(query);
	const initialMatches =
		initialWindow && typeof initialWindow.matchMedia === "function"
			? initialWindow.matchMedia(initialQuery).matches
			: resolveFallbackMatches(initialQuery);
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
			if (
				nextValue.window === undefined ||
				nextValue.window === null ||
				typeof nextValue.window.matchMedia !== "function"
			) {
				matches.value = resolveFallbackMatches(nextValue.query);
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
