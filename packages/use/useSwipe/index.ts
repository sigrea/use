import { computed, readonly, signal, watch } from "@sigrea/core";
import { listen, resolveTarget, resolveValue } from "../../shared";
import type {
	MaybeTarget,
	Position,
	UseSwipeDirection,
	UseSwipeOptions,
	UseSwipeReturn,
	UseSwipeWindowLike,
} from "../types";

const defaultThreshold = 50;

function getTouchPosition(event: TouchEvent): Position | undefined {
	const touch = event.touches[0];

	if (event.touches.length !== 1 || touch === undefined) {
		return undefined;
	}

	return {
		x: touch.clientX,
		y: touch.clientY,
	};
}

function getDirection(
	lengthX: number,
	lengthY: number,
	threshold: number,
): UseSwipeDirection {
	const absX = Math.abs(lengthX);
	const absY = Math.abs(lengthY);

	if (Math.max(absX, absY) < threshold) {
		return "none";
	}

	if (absX > absY) {
		return lengthX > 0 ? "left" : "right";
	}

	return lengthY > 0 ? "up" : "down";
}

/**
 * Reactive swipe detection based on Touch Events.
 *
 * @param target Swipe target.
 * @param options Swipe behavior options.
 */
export function useSwipe<
	TWindow extends UseSwipeWindowLike = UseSwipeWindowLike,
>(
	target: MaybeTarget<EventTarget | null | undefined>,
	options: UseSwipeOptions<TWindow> = {},
): UseSwipeReturn {
	const startX = signal(0);
	const startY = signal(0);
	const endX = signal(0);
	const endY = signal(0);
	const isSwiping = signal(false);
	const lengthX = computed(() => startX.value - endX.value);
	const lengthY = computed(() => startY.value - endY.value);
	const direction = computed(() =>
		getDirection(
			lengthX.value,
			lengthY.value,
			resolveValue(options.threshold ?? defaultThreshold),
		),
	);
	const coordsStart = computed(() => ({
		x: startX.value,
		y: startY.value,
	}));
	const coordsEnd = computed(() => ({
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

	const resetSwipe = (): void => {
		isSwiping.value = false;
		endX.value = startX.value;
		endY.value = startY.value;
	};

	const start = (event: TouchEvent): void => {
		const position = getTouchPosition(event);
		if (position === undefined) {
			return;
		}

		setStartPosition(position);
		options.onSwipeStart?.(event);
	};

	const move = (event: TouchEvent): void => {
		const position = getTouchPosition(event);
		if (position === undefined) {
			return;
		}

		setEndPosition(position);

		if (
			options.passive === false &&
			event.cancelable &&
			Math.abs(lengthX.value) > Math.abs(lengthY.value)
		) {
			event.preventDefault();
		}

		if (!isSwiping.value && direction.value !== "none") {
			isSwiping.value = true;
		}

		if (isSwiping.value) {
			options.onSwipe?.(event);
		}
	};

	const end = (event: TouchEvent): void => {
		if (isSwiping.value) {
			options.onSwipeEnd?.(event, direction.value);
		}

		isSwiping.value = false;
	};

	const stopWatch = watch(
		() => ({
			passive: options.passive ?? true,
			target: resolveTarget(target),
		}),
		(nextValue, previousValue, onCleanup) => {
			if (
				previousValue !== undefined &&
				previousValue.target !== nextValue.target
			) {
				resetSwipe();
			}

			if (nextValue.target === undefined) {
				return;
			}

			const listenerOptions: AddEventListenerOptions = {
				capture: !nextValue.passive,
				passive: nextValue.passive,
			};
			const cleanups = [
				listen(
					nextValue.target,
					"touchstart",
					start as EventListener,
					listenerOptions,
				),
				listen(
					nextValue.target,
					"touchmove",
					move as EventListener,
					listenerOptions,
				),
				listen(
					nextValue.target,
					"touchend",
					end as EventListener,
					listenerOptions,
				),
				listen(
					nextValue.target,
					"touchcancel",
					end as EventListener,
					listenerOptions,
				),
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
		coordsStart,
		coordsEnd,
		lengthX,
		lengthY,
		stop: () => {
			resetSwipe();
			stopWatch();
		},
	};
}
