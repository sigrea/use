import { readonly, signal, watch } from "@sigrea/core";

import { defaultWindow, resolveTarget } from "../../shared";
import { tryOnScopeDispose } from "../tryOnScopeDispose";
import type {
	MaybeTarget,
	UseMousePressedOptions,
	UseMousePressedReturn,
	UseMousePressedSourceEvent,
	UseMousePressedWindowLike,
	UseMouseSourceType,
} from "../types";
import { useEventListener } from "../useEventListener";

export function useMousePressed<
	TWindow extends UseMousePressedWindowLike = UseMousePressedWindowLike,
	TTarget extends EventTarget = EventTarget,
>(
	options: UseMousePressedOptions<TWindow, TTarget> = {},
): UseMousePressedReturn {
	const {
		touch = true,
		drag = true,
		capture = false,
		initialValue = false,
	} = options;
	const windowTarget =
		"window" in options && options.window !== undefined
			? options.window
			: (defaultWindow as MaybeTarget<TWindow> | undefined);
	const pressed = signal(initialValue);
	const sourceType = signal<UseMouseSourceType>(null);
	let stopped = false;
	const hasExplicitNullTarget = options.target === null;
	const shouldFallbackToWindow =
		!("target" in options) || options.target === undefined;
	const releaseTarget = hasExplicitNullTarget ? undefined : windowTarget;

	const currentWindow = () =>
		windowTarget === undefined
			? undefined
			: resolveTarget<TWindow | null | undefined>(windowTarget);
	const currentPressTarget = () => {
		const windowValue = currentWindow();
		if (!windowValue) {
			return undefined;
		}

		const target = resolveTarget<TTarget | null | undefined>(options.target);

		return target ?? (shouldFallbackToWindow ? windowValue : undefined);
	};
	const listenerOptions = { passive: true, capture };
	const onPressed =
		(nextSourceType: UseMouseSourceType) =>
		(event: UseMousePressedSourceEvent) => {
			if (stopped) {
				return;
			}

			pressed.value = true;
			sourceType.value = nextSourceType;
			options.onPressed?.(event);
		};
	const onReleased = (event: UseMousePressedSourceEvent) => {
		if (stopped) {
			return;
		}

		pressed.value = false;
		sourceType.value = null;
		options.onReleased?.(event);
	};
	const stopWindowWatch = watch(
		currentWindow,
		(nextWindow, previousWindow) => {
			if (nextWindow !== previousWindow) {
				pressed.value = false;
				sourceType.value = null;
			}
		},
		{ flush: "sync" },
	);

	const mouseDown = useEventListener(
		currentPressTarget,
		"mousedown",
		onPressed("mouse") as EventListener,
		listenerOptions,
	);
	const mouseLeave = useEventListener(
		releaseTarget,
		"mouseleave",
		onReleased as EventListener,
		listenerOptions,
	);
	const mouseUp = useEventListener(
		releaseTarget,
		"mouseup",
		onReleased as EventListener,
		listenerOptions,
	);
	const dragStart = drag
		? useEventListener(
				currentPressTarget,
				"dragstart",
				onPressed("mouse") as EventListener,
				listenerOptions,
			)
		: undefined;
	const drop = drag
		? useEventListener(
				releaseTarget,
				"drop",
				onReleased as EventListener,
				listenerOptions,
			)
		: undefined;
	const dragEnd = drag
		? useEventListener(
				releaseTarget,
				"dragend",
				onReleased as EventListener,
				listenerOptions,
			)
		: undefined;
	const touchStart = touch
		? useEventListener(
				currentPressTarget,
				"touchstart",
				onPressed("touch") as EventListener,
				listenerOptions,
			)
		: undefined;
	const touchEnd = touch
		? useEventListener(
				releaseTarget,
				"touchend",
				onReleased as EventListener,
				listenerOptions,
			)
		: undefined;
	const touchCancel = touch
		? useEventListener(
				releaseTarget,
				"touchcancel",
				onReleased as EventListener,
				listenerOptions,
			)
		: undefined;

	const stop = () => {
		if (stopped) {
			return;
		}

		stopped = true;
		pressed.value = false;
		sourceType.value = null;
		mouseDown.stop();
		stopWindowWatch();
		mouseLeave.stop();
		mouseUp.stop();
		dragStart?.stop();
		drop?.stop();
		dragEnd?.stop();
		touchStart?.stop();
		touchEnd?.stop();
		touchCancel?.stop();
	};

	tryOnScopeDispose(stop);

	return {
		pressed: readonly(pressed),
		sourceType: readonly(sourceType),
		stop,
	};
}
