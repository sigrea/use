import { readonly, signal, watch } from "@sigrea/core";

import { defaultWindow, resolveTarget } from "../../shared";
import type {
	MaybeTarget,
	UseElementBoundingOptions,
	UseElementBoundingReturn,
	UseElementBoundingWindowLike,
} from "../types";
import { useEventListener } from "../useEventListener";

interface ElementBoundingState {
	bottom: number;
	height: number;
	left: number;
	right: number;
	top: number;
	width: number;
	x: number;
	y: number;
}

const emptyBounding: ElementBoundingState = {
	bottom: 0,
	height: 0,
	left: 0,
	right: 0,
	top: 0,
	width: 0,
	x: 0,
	y: 0,
};

function getResizeObserver(
	windowTarget: UseElementBoundingWindowLike | undefined,
	allowGlobalFallback: boolean,
): typeof ResizeObserver | undefined {
	return (
		windowTarget?.ResizeObserver ??
		(allowGlobalFallback ? globalThis.ResizeObserver : undefined)
	);
}

function getMutationObserver(
	windowTarget: UseElementBoundingWindowLike | undefined,
	allowGlobalFallback: boolean,
): typeof MutationObserver | undefined {
	return (
		windowTarget?.MutationObserver ??
		(allowGlobalFallback ? globalThis.MutationObserver : undefined)
	);
}

function getRequestAnimationFrame(
	windowTarget: UseElementBoundingWindowLike | undefined,
	allowGlobalFallback: boolean,
): UseElementBoundingWindowLike["requestAnimationFrame"] | undefined {
	return (
		windowTarget?.requestAnimationFrame ??
		(allowGlobalFallback ? globalThis.requestAnimationFrame : undefined)
	);
}

function getCancelAnimationFrame(
	windowTarget: UseElementBoundingWindowLike | undefined,
	allowGlobalFallback: boolean,
): UseElementBoundingWindowLike["cancelAnimationFrame"] | undefined {
	return (
		windowTarget?.cancelAnimationFrame ??
		(allowGlobalFallback ? globalThis.cancelAnimationFrame : undefined)
	);
}

function readBounding(element: Element): ElementBoundingState {
	const rect = element.getBoundingClientRect();

	return {
		bottom: rect.bottom,
		height: rect.height,
		left: rect.left,
		right: rect.right,
		top: rect.top,
		width: rect.width,
		x: rect.x,
		y: rect.y,
	};
}

export function useElementBounding<
	TWindow extends UseElementBoundingWindowLike = UseElementBoundingWindowLike,
>(
	target: MaybeTarget<Element>,
	options: UseElementBoundingOptions<TWindow> = {},
): UseElementBoundingReturn {
	const {
		reset = true,
		windowResize = true,
		windowScroll = true,
		immediate = true,
		updateTiming = "sync",
	} = options;
	const useDefaultWindow =
		!("window" in options) || options.window === undefined;
	const windowTarget = useDefaultWindow
		? (defaultWindow as MaybeTarget<TWindow> | undefined)
		: options.window;
	const height = signal(0);
	const bottom = signal(0);
	const left = signal(0);
	const right = signal(0);
	const top = signal(0);
	const width = signal(0);
	const x = signal(0);
	const y = signal(0);
	let frameHandle: number | undefined;
	let frameWindow: TWindow | undefined;

	const currentWindow = () =>
		windowTarget === undefined
			? undefined
			: resolveTarget<TWindow>(windowTarget);

	const setBounding = (state: ElementBoundingState) => {
		height.value = state.height;
		bottom.value = state.bottom;
		left.value = state.left;
		right.value = state.right;
		top.value = state.top;
		width.value = state.width;
		x.value = state.x;
		y.value = state.y;
	};

	const recalculate = () => {
		const element = resolveTarget(target);
		if (!element) {
			if (reset) {
				setBounding(emptyBounding);
			}
			return;
		}

		setBounding(readBounding(element));
	};

	const cancelPendingFrame = () => {
		if (frameHandle === undefined) {
			return;
		}

		const cancelFrame = getCancelAnimationFrame(frameWindow, useDefaultWindow);
		if (typeof cancelFrame === "function") {
			cancelFrame.call(frameWindow ?? globalThis, frameHandle);
		}
		frameHandle = undefined;
		frameWindow = undefined;
	};

	const update = () => {
		if (updateTiming === "sync") {
			cancelPendingFrame();
			recalculate();
			return;
		}

		if (frameHandle !== undefined) {
			return;
		}

		const windowValue = currentWindow();
		const requestFrame = getRequestAnimationFrame(
			windowValue,
			useDefaultWindow,
		);
		if (typeof requestFrame !== "function") {
			recalculate();
			return;
		}

		frameWindow = windowValue;
		frameHandle = requestFrame.call(windowValue ?? globalThis, () => {
			frameHandle = undefined;
			frameWindow = undefined;
			recalculate();
		});
	};

	const stopWatch = watch(
		() => ({
			element: resolveTarget(target),
			window: currentWindow(),
		}),
		({ element, window }, _previousValue, onCleanup) => {
			if (!element) {
				if (reset) {
					setBounding(emptyBounding);
				}
				return;
			}

			if (immediate) {
				update();
			}

			const cleanupHandlers: Array<() => void> = [];
			const ResizeObserverCtor = getResizeObserver(window, useDefaultWindow);
			if (typeof ResizeObserverCtor === "function") {
				const observer = new ResizeObserverCtor(() => {
					update();
				});
				observer.observe(element);
				cleanupHandlers.push(() => {
					observer.disconnect();
				});
			}

			const MutationObserverCtor = getMutationObserver(
				window,
				useDefaultWindow,
			);
			if (typeof MutationObserverCtor === "function") {
				const observer = new MutationObserverCtor(() => {
					update();
				});
				observer.observe(element, {
					attributeFilter: ["style", "class"],
					attributes: true,
				});
				cleanupHandlers.push(() => {
					observer.disconnect();
				});
			}

			onCleanup(() => {
				for (const cleanup of cleanupHandlers) {
					cleanup();
				}
			});
		},
		{ immediate: true, flush: "sync" },
	);
	const windowResizeStop = windowResize
		? useEventListener(
				windowTarget as MaybeTarget<EventTarget> | undefined,
				"resize",
				update,
				{ passive: true },
			)
		: undefined;
	const windowScrollStop = windowScroll
		? useEventListener(
				windowTarget as MaybeTarget<EventTarget> | undefined,
				"scroll",
				update,
				{ capture: true, passive: true },
			)
		: undefined;

	return {
		height: readonly(height),
		bottom: readonly(bottom),
		left: readonly(left),
		right: readonly(right),
		top: readonly(top),
		width: readonly(width),
		x: readonly(x),
		y: readonly(y),
		update,
		stop: () => {
			cancelPendingFrame();
			stopWatch();
			windowResizeStop?.stop();
			windowScrollStop?.stop();
		},
	};
}
