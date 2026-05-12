import { computed, readonly, signal, watch } from "@sigrea/core";
import { listen, resolveTarget, resolveValue } from "../../shared";
import type {
	MaybeTarget,
	MaybeValue,
	Position,
	UsePointerSwipeDirection,
	UsePointerSwipeElement,
	UsePointerSwipeOptions,
	UsePointerSwipePointerType,
	UsePointerSwipeReturn,
} from "../types";

const defaultThreshold = 50;

function resolveBoolean(
	value: MaybeValue<boolean> | undefined,
	fallback: boolean,
): boolean {
	return resolveValue(value ?? fallback);
}

function getPosition(event: PointerEvent): Position {
	return {
		x: event.clientX,
		y: event.clientY,
	};
}

function getDirection(
	distanceX: number,
	distanceY: number,
	threshold: number,
): UsePointerSwipeDirection {
	const absX = Math.abs(distanceX);
	const absY = Math.abs(distanceY);

	if (Math.max(absX, absY) < threshold) {
		return "none";
	}

	if (absX > absY) {
		return distanceX > 0 ? "left" : "right";
	}

	return distanceY > 0 ? "up" : "down";
}

function isPointerTypeAllowed(
	event: PointerEvent,
	pointerTypes: MaybeValue<readonly UsePointerSwipePointerType[]> | undefined,
): boolean {
	const resolvedPointerTypes = resolveValue(pointerTypes);

	return (
		resolvedPointerTypes === undefined ||
		resolvedPointerTypes.includes(event.pointerType)
	);
}

function isPrimaryButtonEvent(event: PointerEvent): boolean {
	return event.buttons === 0 || event.buttons === 1;
}

function handleEvent(
	event: PointerEvent,
	options: UsePointerSwipeOptions,
): void {
	if (resolveBoolean(options.preventDefault, false) && event.cancelable) {
		event.preventDefault();
	}

	if (resolveBoolean(options.stopPropagation, false)) {
		event.stopPropagation();
	}
}

function applySwipeStyles(
	target: UsePointerSwipeElement,
	disableTextSelect: boolean,
	touchAction: string,
): () => void {
	const previousTouchAction = target.style.touchAction;
	const previousWebkitUserSelect = target.style.webkitUserSelect;
	const previousUserSelect = target.style.userSelect;
	const styleWithMsUserSelect = target.style as CSSStyleDeclaration & {
		msUserSelect?: string;
	};
	const previousMsUserSelect = styleWithMsUserSelect.msUserSelect;

	target.style.touchAction = touchAction;

	if (disableTextSelect) {
		target.style.webkitUserSelect = "none";
		styleWithMsUserSelect.msUserSelect = "none";
		target.style.userSelect = "none";
	}

	return () => {
		target.style.touchAction = previousTouchAction;
		if (disableTextSelect) {
			target.style.webkitUserSelect = previousWebkitUserSelect;
			styleWithMsUserSelect.msUserSelect = previousMsUserSelect;
			target.style.userSelect = previousUserSelect;
		}
	};
}

/**
 * Reactive swipe detection based on Pointer Events.
 *
 * @param target Swipe target element.
 * @param options Swipe behavior options.
 */
export function usePointerSwipe(
	target: MaybeTarget<UsePointerSwipeElement | null | undefined>,
	options: UsePointerSwipeOptions = {},
): UsePointerSwipeReturn {
	const startX = signal(0);
	const startY = signal(0);
	const endX = signal(0);
	const endY = signal(0);
	const activePointerId = signal<number | undefined>(undefined);
	const isSwiping = signal(false);
	let capturedElement: UsePointerSwipeElement | undefined;
	const distanceX = computed(() => startX.value - endX.value);
	const distanceY = computed(() => startY.value - endY.value);
	const direction = computed(() =>
		getDirection(
			distanceX.value,
			distanceY.value,
			resolveValue(options.threshold ?? defaultThreshold),
		),
	);
	const posStart = computed(() => ({
		x: startX.value,
		y: startY.value,
	}));
	const posEnd = computed(() => ({
		x: endX.value,
		y: endY.value,
	}));

	const setStartPosition = (position: Position): void => {
		startX.value = position.x;
		startY.value = position.y;
		endX.value = position.x;
		endY.value = position.y;
	};

	const setEndPosition = (position: Position): void => {
		endX.value = position.x;
		endY.value = position.y;
	};

	const releasePointerCapture = (): void => {
		if (capturedElement === undefined || activePointerId.value === undefined) {
			return;
		}

		capturedElement.releasePointerCapture?.(activePointerId.value);
		capturedElement = undefined;
	};

	const resetSwipe = (): void => {
		releasePointerCapture();
		activePointerId.value = undefined;
		isSwiping.value = false;
		endX.value = startX.value;
		endY.value = startY.value;
	};

	const finishSwipe = (): void => {
		releasePointerCapture();
		activePointerId.value = undefined;
		isSwiping.value = false;
	};

	const start = (event: PointerEvent): void => {
		if (
			activePointerId.value !== undefined ||
			resolveBoolean(options.disabled, false) ||
			!isPointerTypeAllowed(event, options.pointerTypes) ||
			!isPrimaryButtonEvent(event)
		) {
			return;
		}

		const currentTarget = resolveTarget(target);
		if (currentTarget === undefined) {
			return;
		}

		const position = getPosition(event);
		setStartPosition(position);
		activePointerId.value = event.pointerId;
		currentTarget.setPointerCapture?.(event.pointerId);
		capturedElement = currentTarget;
		options.onSwipeStart?.(event);
		handleEvent(event, options);
	};

	const move = (event: PointerEvent): void => {
		if (
			activePointerId.value === undefined ||
			activePointerId.value !== event.pointerId ||
			resolveBoolean(options.disabled, false) ||
			!isPointerTypeAllowed(event, options.pointerTypes) ||
			!isPrimaryButtonEvent(event)
		) {
			return;
		}

		setEndPosition(getPosition(event));

		if (!isSwiping.value && direction.value !== "none") {
			isSwiping.value = true;
		}

		if (isSwiping.value) {
			options.onSwipe?.(event);
		}

		handleEvent(event, options);
	};

	const end = (event: PointerEvent): void => {
		if (
			activePointerId.value === undefined ||
			activePointerId.value !== event.pointerId
		) {
			return;
		}

		if (isSwiping.value) {
			options.onSwipeEnd?.(event, direction.value);
		}

		finishSwipe();
		handleEvent(event, options);
	};

	const stopWatch = watch(
		() => ({
			capture: resolveBoolean(options.capture, false),
			disabled: resolveBoolean(options.disabled, false),
			disableTextSelect: resolveBoolean(options.disableTextSelect, false),
			passive: !resolveBoolean(options.preventDefault, false),
			target: resolveTarget(target),
			touchAction: resolveValue(options.touchAction ?? "none"),
		}),
		(nextValue, previousValue, onCleanup) => {
			if (
				previousValue !== undefined &&
				(previousValue.target !== nextValue.target || nextValue.disabled)
			) {
				resetSwipe();
			}

			if (nextValue.disabled || nextValue.target === undefined) {
				return;
			}

			const listenerOptions: AddEventListenerOptions = {
				capture: nextValue.capture,
				passive: nextValue.passive,
			};
			const cleanups = [
				applySwipeStyles(
					nextValue.target,
					nextValue.disableTextSelect,
					nextValue.touchAction,
				),
				listen(nextValue.target, "pointerdown", start, listenerOptions),
				listen(nextValue.target, "pointermove", move, listenerOptions),
				listen(nextValue.target, "pointerup", end, listenerOptions),
				listen(nextValue.target, "pointercancel", end, listenerOptions),
			];

			onCleanup(() => {
				for (const cleanup of cleanups) {
					cleanup();
				}
			});
		},
		{ immediate: true, flush: "sync" },
	);

	return {
		isSwiping: readonly(isSwiping),
		direction,
		posStart,
		posEnd,
		distanceX,
		distanceY,
		stop: () => {
			resetSwipe();
			stopWatch();
		},
	};
}
