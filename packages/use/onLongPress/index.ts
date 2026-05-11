import { getCurrentScope, onDispose, watch } from "@sigrea/core";
import { resolveTarget } from "../../shared";
import type {
	MaybeTarget,
	OnLongPressHandler,
	OnLongPressModifiers,
	OnLongPressOptions,
	OnLongPressReturn,
	Position,
} from "../types";

const defaultDelay = 500;
const defaultDistanceThreshold = 10;

interface PressState {
	timeout?: ReturnType<typeof globalThis.setTimeout>;
	posStart?: Position;
	startTimestamp?: number;
	hasLongPressed: boolean;
}

function getDistance(first: Position, second: Position): number {
	const dx = first.x - second.x;
	const dy = first.y - second.y;

	return Math.sqrt(dx * dx + dy * dy);
}

function getPosition(event: PointerEvent): Position {
	return {
		x: event.clientX,
		y: event.clientY,
	};
}

function clearState(state: PressState): void {
	if (state.timeout !== undefined) {
		globalThis.clearTimeout(state.timeout);
		state.timeout = undefined;
	}

	state.posStart = undefined;
	state.startTimestamp = undefined;
	state.hasLongPressed = false;
}

function applyModifiers(
	event: PointerEvent,
	modifiers: OnLongPressModifiers | undefined,
): void {
	if (modifiers?.prevent === true) {
		event.preventDefault();
	}

	if (modifiers?.stop === true) {
		event.stopPropagation();
	}
}

function getDelay(
	delay: OnLongPressOptions["delay"] | undefined,
	event: PointerEvent,
): number {
	return typeof delay === "function" ? delay(event) : (delay ?? defaultDelay);
}

function isSelfEvent(
	target: MaybeTarget<EventTarget>,
	event: PointerEvent,
	modifiers: OnLongPressModifiers | undefined,
): boolean {
	return modifiers?.self !== true || event.target === target;
}

function createListenerOptions(
	modifiers: OnLongPressModifiers | undefined,
	includeOnce = true,
): AddEventListenerOptions {
	return {
		capture: modifiers?.capture,
		...(includeOnce ? { once: modifiers?.once } : {}),
	};
}

function listenPointer(
	target: Element,
	type: string,
	listener: (event: PointerEvent) => void,
	options: AddEventListenerOptions,
): () => void {
	const eventListener = listener as EventListener;
	target.addEventListener(type, eventListener, options);

	return () => {
		target.removeEventListener(type, eventListener, options);
	};
}

export function onLongPress(
	target: MaybeTarget<Element>,
	handler: OnLongPressHandler,
	options: OnLongPressOptions = {},
): OnLongPressReturn {
	const state: PressState = {
		hasLongPressed: false,
	};
	const { modifiers } = options;
	const listenerOptions = createListenerOptions(modifiers);
	const continuousListenerOptions = createListenerOptions(modifiers, false);
	let stopped = false;

	const stopWatch = watch(
		() => resolveTarget(target),
		(element, _previousElement, onCleanup) => {
			if (stopped || element === undefined) {
				clearState(state);
				return;
			}

			const onRelease = (event: PointerEvent) => {
				if (stopped) {
					return;
				}

				const posStart = state.posStart;
				const startTimestamp = state.startTimestamp;
				const hasLongPressed = state.hasLongPressed;
				clearState(state);

				if (
					options.onMouseUp === undefined ||
					posStart === undefined ||
					startTimestamp === undefined ||
					!isSelfEvent(element, event, modifiers)
				) {
					return;
				}

				applyModifiers(event, modifiers);
				options.onMouseUp(
					event.timeStamp - startTimestamp,
					getDistance(posStart, getPosition(event)),
					hasLongPressed,
					event,
				);
			};

			const onDown = (event: PointerEvent) => {
				if (stopped || !isSelfEvent(element, event, modifiers)) {
					return;
				}

				clearState(state);
				applyModifiers(event, modifiers);
				state.posStart = getPosition(event);
				state.startTimestamp = event.timeStamp;
				state.timeout = globalThis.setTimeout(
					() => {
						if (stopped) {
							return;
						}

						state.hasLongPressed = true;
						handler(event);
					},
					getDelay(options.delay, event),
				);
			};

			const onMove = (event: PointerEvent) => {
				if (
					stopped ||
					state.posStart === undefined ||
					options.distanceThreshold === false ||
					!isSelfEvent(element, event, modifiers)
				) {
					return;
				}

				applyModifiers(event, modifiers);
				const distanceThreshold =
					options.distanceThreshold ?? defaultDistanceThreshold;

				if (
					getDistance(state.posStart, getPosition(event)) >= distanceThreshold
				) {
					clearState(state);
				}
			};

			const cleanups = [
				listenPointer(element, "pointerdown", onDown, listenerOptions),
				listenPointer(
					element,
					"pointermove",
					onMove,
					continuousListenerOptions,
				),
				listenPointer(
					element,
					"pointerup",
					onRelease,
					continuousListenerOptions,
				),
				listenPointer(
					element,
					"pointerleave",
					onRelease,
					continuousListenerOptions,
				),
				listenPointer(
					element,
					"pointercancel",
					() => clearState(state),
					continuousListenerOptions,
				),
			];

			onCleanup(() => {
				clearState(state);
				for (const cleanup of cleanups) {
					cleanup();
				}
			});
		},
		{ immediate: true, flush: "sync" },
	);

	const stop = () => {
		if (stopped) {
			return;
		}

		stopped = true;
		clearState(state);
		stopWatch();
	};

	const scope = getCurrentScope();
	if (scope !== undefined) {
		onDispose(stop, scope);
	}

	return stop;
}
