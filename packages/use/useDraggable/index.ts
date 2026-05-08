import { computed, readonly, signal, watch } from "@sigrea/core";
import {
	defaultWindow,
	listen,
	resolveTarget,
	resolveValue,
} from "../../shared";
import type {
	MaybeTarget,
	MaybeValue,
	Position,
	UseDraggableDraggingElement,
	UseDraggableElement,
	UseDraggableOptions,
	UseDraggableReturn,
} from "../types";

const defaultInitialValue: Position = { x: 0, y: 0 };
const defaultButtons = [0] as const;

function resolveBoolean(
	value: MaybeValue<boolean> | undefined,
	fallback: boolean,
): boolean {
	return resolveValue(value ?? fallback);
}

function getPosition(x: number, y: number): Position {
	return { x, y };
}

function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), Math.max(min, max));
}

function getPressedDelta(
	event: PointerEvent,
	target: UseDraggableElement,
	container: UseDraggableElement | undefined,
): Position {
	const targetRect = target.getBoundingClientRect();

	if (container === undefined) {
		return {
			x: event.clientX - targetRect.left,
			y: event.clientY - targetRect.top,
		};
	}

	const containerRect = container.getBoundingClientRect();

	return {
		x:
			event.clientX -
			(targetRect.left - containerRect.left + container.scrollLeft),
		y:
			event.clientY -
			(targetRect.top - containerRect.top + container.scrollTop),
	};
}

function resolveDraggingElement(
	draggingElement: MaybeTarget<UseDraggableDraggingElement> | undefined,
): UseDraggableDraggingElement | undefined {
	return draggingElement === undefined
		? undefined
		: resolveTarget(draggingElement);
}

/**
 * Make an element draggable with Pointer Events.
 *
 * @param target Draggable element.
 * @param options Drag behavior options.
 */
export function useDraggable(
	target: MaybeTarget<UseDraggableElement>,
	options: UseDraggableOptions = {},
): UseDraggableReturn {
	const draggingElement =
		options.draggingElement === undefined
			? (defaultWindow as MaybeTarget<UseDraggableDraggingElement> | undefined)
			: options.draggingElement;
	const draggingHandle = options.handle === undefined ? target : options.handle;
	const initialValue = resolveValue(
		options.initialValue ?? defaultInitialValue,
	);
	const x = signal(initialValue.x);
	const y = signal(initialValue.y);
	const pressedDelta = signal<Position | undefined>(undefined);
	const activePointerId = signal<number | undefined>(undefined);
	const position = computed(() => getPosition(x.value, y.value));
	const isDragging = computed(() => pressedDelta.value !== undefined);
	const style = computed(() => `left: ${x.value}px; top: ${y.value}px;`);

	const currentContainer = () =>
		options.containerElement === undefined
			? undefined
			: resolveTarget(options.containerElement);

	const isPointerTypeAllowed = (event: PointerEvent) => {
		const pointerTypes = resolveValue(options.pointerTypes);

		return (
			pointerTypes === undefined || pointerTypes.includes(event.pointerType)
		);
	};

	const handleEvent = (event: PointerEvent) => {
		if (resolveBoolean(options.preventDefault, false) && event.cancelable) {
			event.preventDefault();
		}

		if (resolveBoolean(options.stopPropagation, false)) {
			event.stopPropagation();
		}
	};

	const resetDragging = () => {
		pressedDelta.value = undefined;
		activePointerId.value = undefined;
	};

	const setPosition = (nextPosition: Position) => {
		x.value = nextPosition.x;
		y.value = nextPosition.y;
	};

	const start = (event: PointerEvent) => {
		if (activePointerId.value !== undefined) {
			return;
		}

		if (resolveBoolean(options.disabled, false)) {
			return;
		}

		if (!isPointerTypeAllowed(event)) {
			return;
		}

		const buttons = resolveValue(options.buttons ?? defaultButtons);
		if (!buttons.includes(event.button)) {
			return;
		}

		const targetElement = resolveTarget(target);
		if (targetElement === undefined) {
			return;
		}

		const handleElement = resolveTarget(draggingHandle);
		if (
			resolveBoolean(options.exact, false) &&
			(handleElement === undefined || event.target !== handleElement)
		) {
			return;
		}

		const nextPressedDelta = getPressedDelta(
			event,
			targetElement,
			currentContainer(),
		);
		if (options.onStart?.(nextPressedDelta, event) === false) {
			return;
		}

		pressedDelta.value = nextPressedDelta;
		activePointerId.value = event.pointerId;
		handleEvent(event);
	};

	const move = (event: PointerEvent) => {
		if (
			pressedDelta.value === undefined ||
			activePointerId.value !== event.pointerId ||
			resolveBoolean(options.disabled, false)
		) {
			return;
		}

		const targetElement = resolveTarget(target);
		if (targetElement === undefined) {
			resetDragging();
			return;
		}

		const container = currentContainer();
		const targetRect = targetElement.getBoundingClientRect();
		const axis = resolveValue(options.axis ?? "both");
		let nextX = x.value;
		let nextY = y.value;

		if (axis === "x" || axis === "both") {
			nextX = event.clientX - pressedDelta.value.x;
			if (container !== undefined) {
				nextX = clamp(nextX, 0, container.scrollWidth - targetRect.width);
			}
		}

		if (axis === "y" || axis === "both") {
			nextY = event.clientY - pressedDelta.value.y;
			if (container !== undefined) {
				nextY = clamp(nextY, 0, container.scrollHeight - targetRect.height);
			}
		}

		const nextPosition = getPosition(nextX, nextY);
		setPosition(nextPosition);
		options.onMove?.(nextPosition, event);
		handleEvent(event);
	};

	const end = (event: PointerEvent) => {
		if (
			pressedDelta.value === undefined ||
			activePointerId.value !== event.pointerId
		) {
			return;
		}

		const lastPosition = position.value;
		resetDragging();
		options.onEnd?.(lastPosition, event);
		handleEvent(event);
	};

	const stopWatch = watch(
		() => ({
			capture: resolveBoolean(options.capture, true),
			container: currentContainer(),
			disabled: resolveBoolean(options.disabled, false),
			draggingElement: resolveDraggingElement(draggingElement),
			handle: resolveTarget(draggingHandle),
			passive: !resolveBoolean(options.preventDefault, false),
			target: resolveTarget(target),
		}),
		(nextValue, previousValue, onCleanup) => {
			if (
				previousValue !== undefined &&
				(previousValue.container !== nextValue.container ||
					previousValue.draggingElement !== nextValue.draggingElement ||
					previousValue.handle !== nextValue.handle ||
					previousValue.target !== nextValue.target ||
					nextValue.disabled)
			) {
				resetDragging();
			}

			if (
				nextValue.disabled ||
				nextValue.draggingElement === undefined ||
				nextValue.handle === undefined ||
				nextValue.target === undefined
			) {
				return;
			}

			const listenerOptions: AddEventListenerOptions = {
				capture: nextValue.capture,
				passive: nextValue.passive,
			};
			const cleanups = [
				listen(nextValue.handle, "pointerdown", start, listenerOptions),
				listen(nextValue.draggingElement, "pointermove", move, listenerOptions),
				listen(nextValue.draggingElement, "pointerup", end, listenerOptions),
				listen(
					nextValue.draggingElement,
					"pointercancel",
					end,
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
		x: readonly(x),
		y: readonly(y),
		position,
		isDragging,
		style,
		stop: () => {
			resetDragging();
			stopWatch();
		},
	};
}
