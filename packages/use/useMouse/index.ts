import { readonly, signal } from "@sigrea/core";
import { defaultWindow, resolveTarget } from "../../shared";
import type {
	MaybeTarget,
	MouseWindowLike,
	UseMouseCoordType,
	UseMouseEventExtractor,
	UseMouseOptions,
	UseMouseReturn,
	UseMouseSourceType,
} from "../types";
import { useEventListener } from "../useEventListener";

function isMouseEvent(event: MouseEvent | Touch): event is MouseEvent {
	return (
		(typeof MouseEvent !== "undefined" && event instanceof MouseEvent) ||
		"movementX" in event
	);
}

const builtinExtractors: Record<UseMouseCoordType, UseMouseEventExtractor> = {
	page: (event) => [event.pageX, event.pageY],
	client: (event) => [event.clientX, event.clientY],
	screen: (event) => [event.screenX, event.screenY],
	movement: (event) =>
		isMouseEvent(event) ? [event.movementX, event.movementY] : null,
};

export function useMouse<
	TWindow extends MouseWindowLike = MouseWindowLike,
	TTarget extends EventTarget = EventTarget,
>(options: UseMouseOptions<TWindow, TTarget> = {}): UseMouseReturn {
	const {
		type = "page",
		touch = true,
		scroll = true,
		resetOnTouchEnds = false,
		initialValue = { x: 0, y: 0 },
	} = options;
	const windowTarget =
		"window" in options && options.window !== undefined
			? options.window
			: (defaultWindow as MaybeTarget<TWindow> | undefined);
	const target = options.target === undefined ? windowTarget : options.target;
	const hasNullTarget = options.target === null;
	const x = signal(initialValue.x);
	const y = signal(initialValue.y);
	const sourceType = signal<UseMouseSourceType>(null);
	const extractor = typeof type === "function" ? type : builtinExtractors[type];
	let previousMouseEvent: MouseEvent | null = null;
	let previousScrollX = 0;
	let previousScrollY = 0;

	const currentWindow = () =>
		windowTarget === undefined
			? undefined
			: resolveTarget<TWindow>(windowTarget);

	const mouseHandler = (event: MouseEvent) => {
		const result = extractor(event);
		previousMouseEvent = event;

		if (result) {
			x.value = result[0];
			y.value = result[1];
			sourceType.value = "mouse";
		}

		const windowValue = currentWindow();
		if (windowValue) {
			previousScrollX = windowValue.scrollX;
			previousScrollY = windowValue.scrollY;
		}
	};

	const touchHandler = (event: TouchEvent) => {
		const touchPoint = event.touches[0];
		if (touchPoint === undefined) {
			return;
		}

		const result = extractor(touchPoint);
		if (result) {
			x.value = result[0];
			y.value = result[1];
			sourceType.value = "touch";
		}
	};

	const scrollHandler = () => {
		const windowValue = currentWindow();
		if (!previousMouseEvent || !windowValue) {
			return;
		}

		const position = extractor(previousMouseEvent);
		if (position) {
			x.value = position[0] + windowValue.scrollX - previousScrollX;
			y.value = position[1] + windowValue.scrollY - previousScrollY;
		}
	};

	const reset = () => {
		x.value = initialValue.x;
		y.value = initialValue.y;
	};

	const listenerOptions = { passive: true };
	const mouse = useEventListener(
		target as MaybeTarget<EventTarget>,
		["mousemove", "dragover"],
		mouseHandler as EventListener,
		listenerOptions,
	);
	const touchMove =
		touch && type !== "movement"
			? useEventListener(
					target as MaybeTarget<EventTarget>,
					["touchstart", "touchmove"],
					touchHandler as EventListener,
					listenerOptions,
				)
			: undefined;
	const touchEnd =
		touch && type !== "movement" && resetOnTouchEnds
			? useEventListener(
					target as MaybeTarget<EventTarget>,
					"touchend",
					reset,
					listenerOptions,
				)
			: undefined;
	const scrollStop =
		!hasNullTarget && scroll && type === "page"
			? useEventListener(
					windowTarget as MaybeTarget<EventTarget>,
					"scroll",
					scrollHandler,
					listenerOptions,
				)
			: undefined;

	return {
		x: readonly(x),
		y: readonly(y),
		sourceType: readonly(sourceType),
		stop: () => {
			mouse.stop();
			touchMove?.stop();
			touchEnd?.stop();
			scrollStop?.stop();
		},
	};
}
