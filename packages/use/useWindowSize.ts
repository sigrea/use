import { readonly, signal, watch } from "@sigrea/core";
import {
	defaultWindow,
	listen,
	resolveTarget,
	watchMediaQuery,
} from "../shared";
import type {
	MatchMediaWindow,
	MaybeTarget,
	UseWindowSizeOptions,
	UseWindowSizeReturn,
	WindowSizeLike,
} from "./types";

export function useWindowSize<TWindow extends WindowSizeLike = WindowSizeLike>(
	options: UseWindowSizeOptions<TWindow> = {},
): UseWindowSizeReturn {
	const includeScrollbar = options.includeScrollbar ?? true;
	const listenOrientation = options.listenOrientation ?? true;
	const sizeType = options.type ?? "inner";
	const fallbackWidth = options.initialWidth ?? 0;
	const fallbackHeight = options.initialHeight ?? 0;
	const windowTarget =
		options.window ?? (defaultWindow as MaybeTarget<TWindow> | undefined);
	const initialWindow =
		windowTarget === undefined
			? undefined
			: resolveTarget<TWindow>(windowTarget);

	const readSize = (currentWindow?: TWindow) => {
		if (currentWindow === undefined || currentWindow === null) {
			return {
				height: fallbackHeight,
				width: fallbackWidth,
			};
		}

		if (
			sizeType === "outer" &&
			currentWindow.outerWidth !== undefined &&
			currentWindow.outerHeight !== undefined
		) {
			return {
				height: currentWindow.outerHeight,
				width: currentWindow.outerWidth,
			};
		}

		const viewport = currentWindow.visualViewport;
		if (sizeType === "visual" && viewport !== undefined && viewport !== null) {
			return {
				height: Math.round(viewport.height),
				width: Math.round(viewport.width),
			};
		}

		if (!includeScrollbar) {
			const root = currentWindow.document?.documentElement;
			if (root !== undefined) {
				return {
					height: root.clientHeight,
					width: root.clientWidth,
				};
			}
		}

		return {
			height: currentWindow.innerHeight,
			width: currentWindow.innerWidth,
		};
	};

	const initialSize = readSize(initialWindow);
	const width = signal(initialSize.width);
	const height = signal(initialSize.height);
	const stop = watch(
		() =>
			windowTarget === undefined
				? undefined
				: resolveTarget<TWindow>(windowTarget),
		(nextWindow, _previousWindow, onCleanup) => {
			if (nextWindow === undefined || nextWindow === null) {
				width.value = fallbackWidth;
				height.value = fallbackHeight;
				return;
			}

			const syncSize = () => {
				const nextSize = readSize(nextWindow);
				width.value = nextSize.width;
				height.value = nextSize.height;
			};

			syncSize();

			const cleanupHandlers: Array<() => void> = [
				listen(nextWindow, "resize", syncSize, {
					passive: true,
				}),
			];

			if (
				sizeType === "visual" &&
				nextWindow.visualViewport !== undefined &&
				nextWindow.visualViewport !== null
			) {
				cleanupHandlers.push(
					listen(nextWindow.visualViewport, "resize", syncSize, {
						passive: true,
					}),
				);
			}

			if (listenOrientation) {
				cleanupHandlers.push(
					watchMediaQuery(
						"(orientation: portrait)",
						() => {
							syncSize();
						},
						{ window: nextWindow as unknown as MatchMediaWindow },
					),
				);
			}

			onCleanup(() => {
				for (const cleanup of cleanupHandlers) {
					cleanup();
				}
			});
		},
		{ immediate: true, flush: "sync" },
	);

	return {
		height: readonly(height),
		stop,
		width: readonly(width),
	};
}
