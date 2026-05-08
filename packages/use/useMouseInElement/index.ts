import { readonly, signal, watch } from "@sigrea/core";

import { defaultWindow, resolveTarget } from "../../shared";
import type {
	MaybeTarget,
	UseMouseInElementOptions,
	UseMouseInElementReturn,
	UseMouseInElementWindowLike,
} from "../types";
import { useEventListener } from "../useEventListener";
import { useMouse } from "../useMouse";

interface RectLike {
	readonly height: number;
	readonly left: number;
	readonly top: number;
	readonly width: number;
}

interface CachedRect {
	readonly height: number;
	readonly positionX: number;
	readonly positionY: number;
	readonly width: number;
}

function isElementLike(value: unknown): value is Element {
	if (value === null || value === undefined) {
		return false;
	}

	return typeof (value as Element).getClientRects === "function";
}

function getResizeObserver(
	windowTarget: UseMouseInElementWindowLike | undefined,
	allowGlobalFallback: boolean,
): typeof ResizeObserver | undefined {
	return (
		windowTarget?.ResizeObserver ??
		(allowGlobalFallback ? globalThis.ResizeObserver : undefined)
	);
}

function getMutationObserver(
	windowTarget: UseMouseInElementWindowLike | undefined,
	allowGlobalFallback: boolean,
): typeof MutationObserver | undefined {
	return (
		windowTarget?.MutationObserver ??
		(allowGlobalFallback ? globalThis.MutationObserver : undefined)
	);
}

function toRects(element: Element): RectLike[] {
	return Array.from(element.getClientRects(), (rect) => ({
		height: rect.height,
		left: rect.left,
		top: rect.top,
		width: rect.width,
	}));
}

export function useMouseInElement<
	TWindow extends UseMouseInElementWindowLike = UseMouseInElementWindowLike,
	TMouseTarget extends EventTarget = EventTarget,
	TElement extends Element = Element,
>(
	target?: MaybeTarget<TElement | null | undefined>,
	options: UseMouseInElementOptions<TWindow, TMouseTarget> = {},
): UseMouseInElementReturn {
	const {
		handleOutside = true,
		windowResize = true,
		windowScroll = true,
	} = options;
	const coordinateType = options.type ?? "page";
	const useDefaultWindow =
		!("window" in options) || options.window === undefined;
	const windowTarget = useDefaultWindow
		? (defaultWindow as MaybeTarget<TWindow> | undefined)
		: options.window;
	const mouseTarget =
		options.target === undefined ? windowTarget : options.target;
	const mouse = useMouse<TWindow, TMouseTarget>({
		...options,
		type: coordinateType,
	});
	const elementX = signal(0);
	const elementY = signal(0);
	const elementPositionX = signal(0);
	const elementPositionY = signal(0);
	const elementHeight = signal(0);
	const elementWidth = signal(0);
	const isOutside = signal(true);
	let stopped = false;
	let cachedRects: CachedRect[] = [];
	const shouldFallbackToBody = target === undefined || target === null;

	const currentWindow = () =>
		windowTarget === undefined
			? undefined
			: resolveTarget<TWindow | null | undefined>(windowTarget);

	const currentElement = (windowValue = currentWindow()) => {
		const element = resolveTarget<TElement | null | undefined>(target);

		return (
			element ??
			(shouldFallbackToBody ? windowValue?.document?.body : undefined)
		);
	};

	const resetElementState = () => {
		cachedRects = [];
		elementX.value = 0;
		elementY.value = 0;
		elementPositionX.value = 0;
		elementPositionY.value = 0;
		elementHeight.value = 0;
		elementWidth.value = 0;
		isOutside.value = true;
	};

	const applyCachedRects = () => {
		if (cachedRects.length === 0) {
			resetElementState();
			return;
		}

		for (const rect of cachedRects) {
			const nextElementX = mouse.x.value - rect.positionX;
			const nextElementY = mouse.y.value - rect.positionY;
			const outside =
				rect.width === 0 ||
				rect.height === 0 ||
				nextElementX < 0 ||
				nextElementY < 0 ||
				nextElementX > rect.width ||
				nextElementY > rect.height;

			elementPositionX.value = rect.positionX;
			elementPositionY.value = rect.positionY;
			elementHeight.value = rect.height;
			elementWidth.value = rect.width;
			isOutside.value = outside;

			if (handleOutside || !outside) {
				elementX.value = nextElementX;
				elementY.value = nextElementY;
			}

			if (!outside) {
				break;
			}
		}
	};

	const readBounds = () => {
		const windowValue = currentWindow();
		if (!windowValue) {
			resetElementState();
			return;
		}

		const element = currentElement(windowValue);
		if (!isElementLike(element)) {
			resetElementState();
			return;
		}

		const rects = toRects(element);
		if (rects.length === 0) {
			resetElementState();
			return;
		}

		const scrollX =
			coordinateType === "page" && typeof windowValue.scrollX === "number"
				? windowValue.scrollX
				: 0;
		const scrollY =
			coordinateType === "page" && typeof windowValue.scrollY === "number"
				? windowValue.scrollY
				: 0;

		cachedRects = rects.map((rect) => ({
			height: rect.height,
			positionX: rect.left + scrollX,
			positionY: rect.top + scrollY,
			width: rect.width,
		}));
		applyCachedRects();
	};

	const stopTargetWatch = watch(
		() => ({
			element: currentElement(),
			window: currentWindow(),
		}),
		({ element, window }, _previousValue, onCleanup) => {
			readBounds();

			if (!window || !isElementLike(element)) {
				return;
			}

			const cleanupHandlers: Array<() => void> = [];
			const ResizeObserverCtor = getResizeObserver(window, useDefaultWindow);
			if (typeof ResizeObserverCtor === "function") {
				const observer = new ResizeObserverCtor(readBounds);
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
				const observer = new MutationObserverCtor(readBounds);
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
		{ flush: "sync", immediate: true },
	);
	const stopMouseWatch = watch(
		() => ({
			x: mouse.x.value,
			y: mouse.y.value,
		}),
		applyCachedRects,
		{ flush: "sync" },
	);
	const mouseMovement = useEventListener(
		mouseTarget as MaybeTarget<EventTarget>,
		["mousemove", "dragover"],
		readBounds,
		{ passive: true },
	);
	const touchMovement =
		(options.touch ?? true)
			? useEventListener(
					mouseTarget as MaybeTarget<EventTarget>,
					["touchstart", "touchmove"],
					readBounds,
					{ passive: true },
				)
			: undefined;
	const mouseLeave = useEventListener(
		() => currentWindow()?.document,
		"mouseleave",
		() => {
			isOutside.value = true;
		},
		{ passive: true },
	);
	const scroll = windowScroll
		? useEventListener(windowTarget, "scroll", readBounds, {
				capture: true,
				passive: true,
			})
		: undefined;
	const resize = windowResize
		? useEventListener(windowTarget, "resize", readBounds, { passive: true })
		: undefined;

	return {
		x: mouse.x,
		y: mouse.y,
		sourceType: mouse.sourceType,
		elementX: readonly(elementX),
		elementY: readonly(elementY),
		elementPositionX: readonly(elementPositionX),
		elementPositionY: readonly(elementPositionY),
		elementHeight: readonly(elementHeight),
		elementWidth: readonly(elementWidth),
		isOutside: readonly(isOutside),
		stop: () => {
			if (stopped) {
				return;
			}

			stopped = true;
			mouse.stop();
			stopTargetWatch();
			stopMouseWatch();
			mouseMovement.stop();
			touchMovement?.stop();
			mouseLeave.stop();
			scroll?.stop();
			resize?.stop();
		},
	};
}
