import { readonly, signal, watch } from "@sigrea/core";

import { defaultWindow, resolveValue } from "../../shared";
import type {
	MaybeTarget,
	MaybeValue,
	UsePointerOptions,
	UsePointerReturn,
	UsePointerState,
	UsePointerType,
	WindowLike,
} from "../types";
import { useEventListener } from "../useEventListener";

const defaultState: UsePointerState = {
	x: 0,
	y: 0,
	height: 0,
	pointerId: 0,
	pointerType: null,
	pressure: 0,
	tiltX: 0,
	tiltY: 0,
	twist: 0,
	width: 0,
};

function isPointerTypeAllowed(
	event: PointerEvent,
	pointerTypes: MaybeValue<readonly UsePointerType[]> | undefined,
): boolean {
	return (
		pointerTypes === undefined ||
		resolveValue(pointerTypes).includes(event.pointerType)
	);
}

function resolveInitialState(
	initialValue: MaybeValue<Partial<UsePointerState>> | undefined,
): UsePointerState {
	return {
		...defaultState,
		...(initialValue === undefined ? undefined : resolveValue(initialValue)),
	};
}

/**
 * Reactive pointer state.
 */
export function usePointer<
	TWindow extends WindowLike = WindowLike,
	TTarget extends EventTarget = EventTarget,
>(options: UsePointerOptions<TWindow, TTarget> = {}): UsePointerReturn {
	const windowTarget =
		"window" in options && options.window !== undefined
			? options.window
			: (defaultWindow as MaybeTarget<TWindow> | undefined);
	const target =
		options.target === undefined
			? (windowTarget as MaybeTarget<TTarget> | undefined)
			: options.target;
	const initialState = resolveInitialState(options.initialValue);
	const x = signal(initialState.x);
	const y = signal(initialState.y);
	const height = signal(initialState.height);
	const isInside = signal(false);
	const pointerId = signal(initialState.pointerId);
	const pointerType = signal<UsePointerType | null>(initialState.pointerType);
	const pressure = signal(initialState.pressure);
	const tiltX = signal(initialState.tiltX);
	const tiltY = signal(initialState.tiltY);
	const twist = signal(initialState.twist);
	const width = signal(initialState.width);

	const updateState = (event: PointerEvent): void => {
		if (!isPointerTypeAllowed(event, options.pointerTypes)) {
			return;
		}

		isInside.value = true;
		x.value = event.x;
		y.value = event.y;
		height.value = event.height;
		pointerId.value = event.pointerId;
		pointerType.value = event.pointerType;
		pressure.value = event.pressure;
		tiltX.value = event.tiltX;
		tiltY.value = event.tiltY;
		twist.value = event.twist;
		width.value = event.width;
	};
	const leave = (event: PointerEvent): void => {
		if (isPointerTypeAllowed(event, options.pointerTypes)) {
			isInside.value = false;
		}
	};
	const resolvedTarget = () =>
		target === undefined ? undefined : resolveValue(target);
	const stopTargetWatch = watch(
		() => resolvedTarget(),
		(currentTarget, previousTarget) => {
			if (previousTarget !== undefined && currentTarget !== previousTarget) {
				isInside.value = false;
			}
		},
		{ immediate: true, flush: "sync" },
	);

	const listenerOptions = { passive: true };
	const pointer = useEventListener(
		target,
		["pointerdown", "pointermove", "pointerup"],
		updateState as EventListener,
		listenerOptions,
	);
	const pointerLeave = useEventListener(
		target,
		"pointerleave",
		leave as EventListener,
		listenerOptions,
	);

	return {
		x: readonly(x),
		y: readonly(y),
		height: readonly(height),
		isInside: readonly(isInside),
		pointerId: readonly(pointerId),
		pointerType: readonly(pointerType),
		pressure: readonly(pressure),
		tiltX: readonly(tiltX),
		tiltY: readonly(tiltY),
		twist: readonly(twist),
		width: readonly(width),
		stop: () => {
			pointer.stop();
			pointerLeave.stop();
			stopTargetWatch();
			isInside.value = false;
		},
	};
}
