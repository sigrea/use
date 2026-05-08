import { nextTick, readonly, signal, watch } from "@sigrea/core";

import { defaultWindow, listen, resolveTarget } from "../../shared";
import { tryOnScopeDispose } from "../tryOnScopeDispose";
import type {
	MaybeTarget,
	UseInfiniteScrollArrivedState,
	UseInfiniteScrollDirections,
	UseInfiniteScrollElement,
	UseInfiniteScrollOptions,
	UseInfiniteScrollReturn,
	UseInfiniteScrollState,
	UseInfiniteScrollWindowLike,
} from "../types";
import { useElementVisibility } from "../useElementVisibility";
import { useThrottleFn } from "../useThrottleFn";

const ARRIVED_STATE_THRESHOLD_PIXELS = 1;

type ScrollableElement = Element & {
	clientHeight: number;
	clientWidth: number;
	scrollHeight: number;
	scrollLeft: number;
	scrollTop: number;
	scrollWidth: number;
};

interface ResolvedScrollTarget<TElement extends UseInfiniteScrollElement> {
	readonly element: ScrollableElement;
	readonly source: NonNullable<TElement>;
}

function createArrivedState(): UseInfiniteScrollArrivedState {
	return {
		bottom: false,
		left: true,
		right: false,
		top: true,
	};
}

function createDirections(): UseInfiniteScrollDirections {
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

function wait(delay: number): Promise<void> {
	return new Promise((resolve) => {
		setTimeout(resolve, Math.max(0, delay));
	});
}

function isWindowTarget(value: EventTarget): value is Window {
	const candidate = value as Window;

	return candidate.document?.documentElement !== undefined;
}

function isDocumentTarget(value: EventTarget): value is Document {
	const candidate = value as Document;

	return candidate.documentElement !== undefined;
}

function resolveScrollTarget<TElement extends UseInfiniteScrollElement>(
	target: MaybeTarget<TElement>,
): ResolvedScrollTarget<TElement> | undefined {
	const source = resolveTarget<TElement>(target);

	if (source === undefined) {
		return undefined;
	}

	if (isWindowTarget(source)) {
		const element = source.document?.documentElement;

		return element === undefined
			? undefined
			: {
					element: element as ScrollableElement,
					source,
				};
	}

	if (isDocumentTarget(source)) {
		return source.documentElement === undefined
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
	windowTarget: UseInfiniteScrollWindowLike | undefined,
	allowFallback: boolean,
): Pick<CSSStyleDeclaration, "direction" | "display" | "flexDirection"> {
	const styleWindow =
		windowTarget ??
		(allowFallback && isWindowTarget(source) ? source : undefined) ??
		(allowFallback
			? (element.ownerDocument?.defaultView as
					| UseInfiniteScrollWindowLike
					| null
					| undefined)
			: undefined) ??
		(allowFallback
			? (defaultWindow as UseInfiniteScrollWindowLike)
			: undefined);

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

export function useInfiniteScroll<
	TElement extends UseInfiniteScrollElement = UseInfiniteScrollElement,
	TWindow extends UseInfiniteScrollWindowLike = UseInfiniteScrollWindowLike,
>(
	target: MaybeTarget<TElement>,
	onLoadMore: (state: UseInfiniteScrollState) => void | PromiseLike<void>,
	options: UseInfiniteScrollOptions<TElement, TWindow> = {},
): UseInfiniteScrollReturn {
	const {
		canLoadMore = () => true,
		direction = "bottom",
		distance = 0,
		eventListenerOptions = {
			capture: false,
			passive: true,
		},
		idle = 200,
		interval = 100,
		offset,
		onError = defaultOnError,
		onScroll,
		onStop,
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
	const x = signal(0);
	const y = signal(0);
	const isScrolling = signal(false);
	const isLoading = signal(false);
	const error = signal<unknown | undefined>(undefined);
	const arrivedState = signal(createArrivedState());
	const directions = signal(createDirections());
	let stopped = false;
	let loadPromise: Promise<void> | undefined;
	let scrollEndTimer: ReturnType<typeof setTimeout> | undefined;
	let stopWatch: () => void = () => {};

	const state: UseInfiniteScrollState = {
		x: readonly(x),
		y: readonly(y),
		isScrolling: readonly(isScrolling),
		arrivedState: readonly(arrivedState),
		directions: readonly(directions),
		measure,
	};
	const visibility = useElementVisibility(() => getCurrentTarget()?.element, {
		window: windowTarget,
	});

	function clearScrollEndTimer(): void {
		if (scrollEndTimer !== undefined) {
			clearTimeout(scrollEndTimer);
			scrollEndTimer = undefined;
		}
	}

	function getOffsetValue(edge: keyof UseInfiniteScrollArrivedState): number {
		return edge === direction
			? (offset?.[edge] ?? distance)
			: (offset?.[edge] ?? 0);
	}

	function finishScroll(event: Event): void {
		if (!isScrolling.value) {
			return;
		}

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

	function measure(): void {
		const current = getCurrentTarget();

		if (current === undefined) {
			arrivedState.value = createArrivedState();
			directions.value = createDirections();
			x.value = 0;
			y.value = 0;
			return;
		}

		const { element, source } = current;
		const {
			direction: styleDirection,
			display,
			flexDirection,
		} = getStyle(element, source, currentWindow(), allowWindowFallback);
		const scrollLeft = element.scrollLeft;
		const scrollTop = readScrollTop(element, source);
		const nextDirections: UseInfiniteScrollDirections = {
			left: scrollLeft < x.value,
			right: scrollLeft > x.value,
			top: scrollTop < y.value,
			bottom: scrollTop > y.value,
		};
		const horizontalOffset = Math.abs(scrollLeft);
		const isRtl = styleDirection === "rtl";
		const left = isRtl
			? horizontalOffset + element.clientWidth >=
				element.scrollWidth -
					getOffsetValue("left") -
					ARRIVED_STATE_THRESHOLD_PIXELS
			: horizontalOffset <= getOffsetValue("left");
		const right = isRtl
			? horizontalOffset <= getOffsetValue("right")
			: horizontalOffset + element.clientWidth >=
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
			left:
				display === "flex" && flexDirection === "row-reverse" ? right : left,
			right:
				display === "flex" && flexDirection === "row-reverse" ? left : right,
			top:
				display === "flex" && flexDirection === "column-reverse" ? bottom : top,
			bottom:
				display === "flex" && flexDirection === "column-reverse" ? top : bottom,
		};
		directions.value = nextDirections;
		x.value = scrollLeft;
		y.value = scrollTop;
	}

	function hasRoomForMore(element: ScrollableElement): boolean {
		return direction === "bottom" || direction === "top"
			? element.scrollHeight <= element.clientHeight
			: element.scrollWidth <= element.clientWidth;
	}

	function canLoad(element: ScrollableElement): boolean {
		try {
			return canLoadMore(element as HTMLElement | SVGElement);
		} catch (caughtError) {
			error.value = caughtError;
			onError(caughtError);
			return false;
		}
	}

	function startLoadMore(): void {
		if (stopped || loadPromise !== undefined) {
			return;
		}

		error.value = undefined;
		isLoading.value = true;
		const currentPromise = Promise.all([
			Promise.resolve().then(() => onLoadMore(state)),
			wait(interval),
		])
			.catch((caughtError) => {
				error.value = caughtError;
				onError(caughtError);
			})
			.then(() => {});
		loadPromise = currentPromise;

		currentPromise.finally(() => {
			if (loadPromise !== currentPromise) {
				return;
			}

			loadPromise = undefined;
			isLoading.value = false;
			if (!stopped) {
				void nextTick().then(checkAndLoad);
			}
		});
	}

	function checkAndLoad(): void {
		const current = getCurrentTarget();

		measure();

		if (
			stopped ||
			current === undefined ||
			!visibility.isVisible.value ||
			!canLoad(current.element) ||
			loadPromise !== undefined
		) {
			return;
		}

		if (arrivedState.value[direction] || hasRoomForMore(current.element)) {
			startLoadMore();
		}
	}

	function handleScroll(event: Event): void {
		if (stopped) {
			return;
		}

		measure();
		isScrolling.value = true;
		scheduleScrollEnd(event);
		onScroll?.(event);
		checkAndLoad();
	}

	const throttledScroll =
		throttle > 0
			? useThrottleFn(
					(event: Event) => {
						handleScroll(event);
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

			void throttledScroll(event);
		},
		eventListenerOptions,
	);
	const scrollEndListener = listen(
		target as MaybeTarget<EventTarget | null | undefined>,
		"scrollend",
		finishScroll,
		eventListenerOptions,
	);
	stopWatch = watch(
		() => {
			const current = getCurrentTarget();

			return {
				canLoad: current === undefined ? false : canLoad(current.element),
				element: current?.element,
				visible: visibility.isVisible.value,
			};
		},
		() => {
			checkAndLoad();
		},
		{ immediate: true, flush: "sync" },
	);

	function reset(): void {
		void nextTick().then(checkAndLoad);
	}

	function stop(): void {
		if (stopped) {
			return;
		}

		stopped = true;
		stopWatch();
		scrollListener();
		scrollEndListener();
		visibility.stop();
		clearScrollEndTimer();
	}

	tryOnScopeDispose(stop);

	return {
		isLoading: readonly(isLoading),
		error: readonly(error),
		reset,
		stop,
	};
}
