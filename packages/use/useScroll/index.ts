import { computed, readonly, signal, watch } from "@sigrea/core";

import {
	defaultWindow,
	listen,
	resolveTarget,
	resolveValue,
} from "../../shared";
import { tryOnScopeDispose } from "../tryOnScopeDispose";
import type {
	MaybeTarget,
	UseScrollArrivedState,
	UseScrollDirections,
	UseScrollDocumentLike,
	UseScrollElement,
	UseScrollOptions,
	UseScrollReturn,
	UseScrollWindowLike,
} from "../types";
import { useMutationObserver } from "../useMutationObserver";
import { useThrottleFn } from "../useThrottleFn";

const ARRIVED_STATE_THRESHOLD_PIXELS = 1;

type ScrollableElement = Element & {
	clientHeight: number;
	clientWidth: number;
	scrollHeight: number;
	scrollLeft: number;
	scrollTo?: (options?: ScrollToOptions) => void;
	scrollTop: number;
	scrollWidth: number;
};

interface ResolvedScrollTarget<TElement extends UseScrollElement> {
	readonly element: ScrollableElement;
	readonly source: NonNullable<TElement>;
}

function createArrivedState(): UseScrollArrivedState {
	return {
		bottom: false,
		left: true,
		right: false,
		top: true,
	};
}

function createDirections(): UseScrollDirections {
	return {
		bottom: false,
		left: false,
		right: false,
		top: false,
	};
}

function defaultOnError(error: unknown): void {
	if (typeof globalThis.reportError === "function") {
		globalThis.reportError(error);
	}
}

function normalizeObserve(observe: UseScrollOptions["observe"]): {
	mutation: boolean;
} {
	if (typeof observe === "boolean") {
		return { mutation: observe };
	}

	return {
		mutation: observe?.mutation ?? false,
	};
}

function isWindowTarget(value: EventTarget): value is UseScrollWindowLike {
	const candidate = value as UseScrollWindowLike;

	return candidate.document?.documentElement !== undefined;
}

function isDocumentTarget(value: EventTarget): value is UseScrollDocumentLike {
	const candidate = value as UseScrollDocumentLike;

	return candidate.documentElement !== undefined;
}

function resolveScrollTarget<TElement extends UseScrollElement>(
	target: MaybeTarget<TElement>,
): ResolvedScrollTarget<TElement> | undefined {
	const source = resolveTarget<TElement>(target);

	if (source === undefined) {
		return undefined;
	}

	if (isWindowTarget(source)) {
		const element = source.document?.documentElement;

		return element === undefined || element === null
			? undefined
			: {
					element: element as ScrollableElement,
					source,
				};
	}

	if (isDocumentTarget(source)) {
		return source.documentElement === undefined ||
			source.documentElement === null
			? undefined
			: {
					element: source.documentElement as ScrollableElement,
					source,
				};
	}

	return {
		element: source as ScrollableElement,
		source,
	};
}

function getStyle(
	element: ScrollableElement,
	source: EventTarget,
	windowTarget: UseScrollWindowLike | null | undefined,
	allowFallback: boolean,
): Pick<CSSStyleDeclaration, "direction" | "display" | "flexDirection"> {
	const styleWindow =
		windowTarget ??
		(allowFallback && isWindowTarget(source) ? source : undefined) ??
		(allowFallback
			? (element.ownerDocument?.defaultView as UseScrollWindowLike | null)
			: undefined) ??
		(allowFallback ? (defaultWindow as UseScrollWindowLike) : undefined);

	return (
		styleWindow?.getComputedStyle?.(element) ?? {
			direction: "ltr",
			display: "",
			flexDirection: "",
		}
	);
}

function readScrollTop(
	element: ScrollableElement,
	source: EventTarget,
): number {
	const scrollTop = element.scrollTop;

	if (scrollTop !== 0 || !isDocumentTarget(source)) {
		return scrollTop;
	}

	return source.body?.scrollTop ?? scrollTop;
}

/**
 * Reactive scroll position and state.
 */
export function useScroll<
	TElement extends UseScrollElement = UseScrollElement,
	TWindow extends UseScrollWindowLike = UseScrollWindowLike,
>(
	target: MaybeTarget<TElement>,
	options: UseScrollOptions<TElement, TWindow> = {},
): UseScrollReturn {
	const {
		behavior = "auto",
		eventListenerOptions = {
			capture: false,
			passive: true,
		},
		idle = 200,
		offset,
		onError = defaultOnError,
		onScroll,
		onStop,
		observe: rawObserve = {
			mutation: false,
		},
		throttle = 0,
	} = options;
	const hasWindowOption = "window" in options && options.window !== undefined;
	const windowTarget = hasWindowOption
		? options.window
		: (defaultWindow as MaybeTarget<TWindow> | undefined);
	const allowWindowFallback = !hasWindowOption;
	const currentWindow = () =>
		windowTarget === undefined
			? undefined
			: resolveTarget<TWindow | null | undefined>(windowTarget);
	const getCurrentTarget = () => resolveScrollTarget(target);
	const internalX = signal(0);
	const internalY = signal(0);
	const isScrolling = signal(false);
	const arrivedState = signal(createArrivedState());
	const directions = signal(createDirections());
	const observe = normalizeObserve(rawObserve);
	let stopped = false;
	let scrollGeneration = 0;
	let scrollEndTimer: ReturnType<typeof setTimeout> | undefined;

	function getOffsetValue(edge: keyof UseScrollArrivedState): number {
		return offset?.[edge] ?? 0;
	}

	function clearScrollEndTimer(): void {
		if (scrollEndTimer !== undefined) {
			clearTimeout(scrollEndTimer);
			scrollEndTimer = undefined;
		}
	}

	function finishScroll(event: Event): void {
		if (!isScrolling.value) {
			return;
		}

		measure();
		scrollGeneration += 1;
		clearScrollEndTimer();
		isScrolling.value = false;
		directions.value = createDirections();
		onStop?.(event);
	}

	function scheduleScrollEnd(event: Event): void {
		clearScrollEndTimer();
		scrollEndTimer = setTimeout(
			() => {
				finishScroll(event);
			},
			Math.max(0, throttle + idle),
		);
	}

	function resetScrollingState(): void {
		clearScrollEndTimer();
		isScrolling.value = false;
		directions.value = createDirections();
	}

	function measure(): void {
		const current = getCurrentTarget();

		if (current === undefined) {
			arrivedState.value = createArrivedState();
			directions.value = createDirections();
			internalX.value = 0;
			internalY.value = 0;
			return;
		}

		const { element, source } = current;
		const {
			direction: styleDirection,
			display,
			flexDirection,
		} = getStyle(element, source, currentWindow(), allowWindowFallback);
		const directionMultiplier = styleDirection === "rtl" ? -1 : 1;
		const scrollLeft = element.scrollLeft;
		const scrollTop = readScrollTop(element, source);
		const nextDirections: UseScrollDirections = {
			bottom: scrollTop > internalY.value,
			left: scrollLeft < internalX.value,
			right: scrollLeft > internalX.value,
			top: scrollTop < internalY.value,
		};
		const left =
			Math.abs(scrollLeft * directionMultiplier) <= getOffsetValue("left");
		const right =
			Math.abs(scrollLeft * directionMultiplier) + element.clientWidth >=
			element.scrollWidth -
				getOffsetValue("right") -
				ARRIVED_STATE_THRESHOLD_PIXELS;
		const top = Math.abs(scrollTop) <= getOffsetValue("top");
		const bottom =
			Math.abs(scrollTop) + element.clientHeight >=
			element.scrollHeight -
				getOffsetValue("bottom") -
				ARRIVED_STATE_THRESHOLD_PIXELS;

		arrivedState.value = {
			bottom:
				display === "flex" && flexDirection === "column-reverse" ? top : bottom,
			left:
				display === "flex" && flexDirection === "row-reverse" ? right : left,
			right:
				display === "flex" && flexDirection === "row-reverse" ? left : right,
			top:
				display === "flex" && flexDirection === "column-reverse" ? bottom : top,
		};
		directions.value = nextDirections;
		internalX.value = scrollLeft;
		internalY.value = scrollTop;
	}

	function applyScrollTo(
		current: ResolvedScrollTarget<TElement>,
		options: ScrollToOptions,
	): void {
		const { element, source } = current;

		if (isWindowTarget(source) && typeof source.scrollTo === "function") {
			source.scrollTo(options);
			return;
		}

		if (isDocumentTarget(source)) {
			const configuredWindow = currentWindow();
			if (typeof configuredWindow?.scrollTo === "function") {
				configuredWindow.scrollTo(options);
				return;
			}
			const view = source.defaultView as UseScrollWindowLike | null | undefined;
			if (typeof view?.scrollTo === "function") {
				view.scrollTo(options);
				return;
			}
			if (typeof source.body?.scrollTo === "function") {
				source.body.scrollTo(options);
				return;
			}
		}

		if (typeof element.scrollTo === "function") {
			element.scrollTo(options);
			return;
		}

		element.scrollLeft = options.left ?? element.scrollLeft;
		element.scrollTop = options.top ?? element.scrollTop;
	}

	function scrollTo(options: ScrollToOptions = {}): void {
		if (stopped) {
			return;
		}

		const current = getCurrentTarget();
		if (current === undefined) {
			return;
		}

		try {
			applyScrollTo(current, {
				behavior: options.behavior ?? resolveValue(behavior),
				left: options.left ?? internalX.value,
				top: options.top ?? internalY.value,
			});
			measure();
		} catch (error) {
			onError(error);
		}
	}

	function handleScroll(event: Event, generation = scrollGeneration): void {
		if (stopped) {
			return;
		}
		if (generation !== scrollGeneration) {
			return;
		}

		measure();
		isScrolling.value = true;
		scheduleScrollEnd(event);
		onScroll?.(event);
	}

	const x = computed({
		get: () => internalX.value,
		set: (value: number) => {
			scrollTo({ left: value });
		},
	});
	const y = computed({
		get: () => internalY.value,
		set: (value: number) => {
			scrollTo({ top: value });
		},
	});
	const throttledScroll =
		throttle > 0
			? useThrottleFn(
					(event: Event, generation: number) => {
						handleScroll(event, generation);
					},
					throttle,
					true,
				)
			: undefined;
	const scrollListener = listen(
		target as MaybeTarget<EventTarget | null | undefined>,
		"scroll",
		(event) => {
			if (throttledScroll === undefined) {
				handleScroll(event);
				return;
			}

			void throttledScroll(event, scrollGeneration);
		},
		eventListenerOptions,
	);
	const scrollEndListener = listen(
		target as MaybeTarget<EventTarget | null | undefined>,
		"scrollend",
		finishScroll,
		eventListenerOptions,
	);
	const mutationObserver = observe.mutation
		? useMutationObserver(
				() => getCurrentTarget()?.element ?? null,
				() => {
					measure();
				},
				{
					attributes: true,
					childList: true,
					subtree: true,
					window: windowTarget as MaybeTarget<TWindow | null | undefined>,
				},
			)
		: undefined;
	const stopWatch = watch(
		() => ({
			element: getCurrentTarget()?.element,
			window: currentWindow(),
		}),
		() => {
			scrollGeneration += 1;
			resetScrollingState();
			measure();
		},
		{ immediate: true, flush: "sync" },
	);

	function stop(): void {
		if (stopped) {
			return;
		}

		stopped = true;
		scrollGeneration += 1;
		resetScrollingState();
		stopWatch();
		scrollListener();
		scrollEndListener();
		mutationObserver?.stop();
	}

	tryOnScopeDispose(stop);

	return {
		arrivedState: readonly(arrivedState),
		directions: readonly(directions),
		isScrolling: readonly(isScrolling),
		measure,
		scrollTo,
		stop,
		x,
		y,
	};
}
