import type { WatchStopHandle } from "@sigrea/core";
import { watch } from "@sigrea/core";

import { defaultWindow } from "./environment";
import { listen } from "./listen";
import { resolveTarget } from "./resolveTarget";
import { resolveValue } from "./resolveValue";
import type {
	ConfigurableWindow,
	MaybeTarget,
	MaybeValue,
	WindowLike,
} from "./types";
import type { WatchTargetOptions } from "./watchTarget";

export interface MatchMediaWindow {
	matchMedia(query: string): MediaQueryList;
}

export interface WatchMediaQueryOptions<
	TWindow extends MatchMediaWindow = MatchMediaWindow,
> extends WatchTargetOptions,
		ConfigurableWindow<TWindow> {}

export type WatchMediaQueryCallback = (
	matches: boolean,
	mediaQueryList: MediaQueryList,
) => void;

function resolveWindowTarget<TWindow extends MatchMediaWindow>(
	options?: WatchMediaQueryOptions<TWindow>,
): MaybeTarget<TWindow> | undefined {
	if (options && "window" in options) {
		return options.window;
	}

	return defaultWindow as MaybeTarget<TWindow> | undefined;
}

export function watchMediaQuery<
	TWindow extends MatchMediaWindow = WindowLike & MatchMediaWindow,
>(
	query: MaybeValue<string>,
	listener: WatchMediaQueryCallback,
	options?: WatchMediaQueryOptions<TWindow>,
): WatchStopHandle {
	const windowTarget = resolveWindowTarget(options);
	const { window: _window, ...watchOptions } = options ?? {};

	return watch(
		() => {
			const currentQuery = resolveValue(query);
			const currentWindow =
				windowTarget === undefined ? undefined : resolveTarget(windowTarget);

			if (!currentWindow || typeof currentWindow.matchMedia !== "function") {
				return;
			}

			return currentWindow.matchMedia(currentQuery);
		},
		(queryList) => {
			if (queryList === undefined) {
				return;
			}

			listener(queryList.matches, queryList);

			return listen(queryList, "change", () => {
				listener(queryList.matches, queryList);
			});
		},
		{
			immediate: true,
			flush: "sync",
			...watchOptions,
		},
	);
}
