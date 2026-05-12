import {
	getCurrentScope,
	onDispose,
	readonly,
	signal,
	watch,
} from "@sigrea/core";
import { defaultWindow, resolveTarget, resolveValue } from "../../shared";
import { onElementRemoval } from "../onElementRemoval";
import type {
	MaybeTarget,
	UseElementHoverDocumentLike,
	UseElementHoverOptions,
	UseElementHoverReturn,
	UseElementHoverWindowLike,
} from "../types";
import { useEventListener } from "../useEventListener";

export function useElementHover<
	TWindow extends UseElementHoverWindowLike = UseElementHoverWindowLike,
	TDocument extends UseElementHoverDocumentLike = UseElementHoverDocumentLike,
>(
	target: MaybeTarget<Element>,
	options: UseElementHoverOptions<TWindow, TDocument> = {},
): UseElementHoverReturn {
	const { delayEnter = 0, delayLeave = 0, triggerOnRemoval = false } = options;
	const useDefaultWindow =
		!("window" in options) || options.window === undefined;
	const windowTarget = useDefaultWindow
		? (defaultWindow as MaybeTarget<TWindow> | undefined)
		: options.window;
	const documentTarget =
		"document" in options && options.document !== undefined
			? options.document
			: undefined;
	const isHovered = signal(false);
	let timer: ReturnType<typeof setTimeout> | undefined;
	let stopped = false;

	const clearTimer = () => {
		if (timer !== undefined) {
			clearTimeout(timer);
			timer = undefined;
		}
	};

	const resetHovered = () => {
		clearTimer();
		isHovered.value = false;
	};

	const setHovered = (hovered: boolean) => {
		if (stopped) {
			return;
		}

		clearTimer();
		const delay = resolveValue(hovered ? delayEnter : delayLeave);
		if (delay <= 0) {
			isHovered.value = hovered;
			return;
		}

		timer = setTimeout(() => {
			timer = undefined;
			if (!stopped) {
				isHovered.value = hovered;
			}
		}, delay);
	};

	const mouseenter = useEventListener(
		target,
		"mouseenter",
		() => setHovered(true),
		{ passive: true },
	);
	const mouseleave = useEventListener(
		target,
		"mouseleave",
		() => setHovered(false),
		{ passive: true },
	);
	const stopTargetWatch = watch(
		() => resolveTarget(target),
		(nextTarget, previousTarget) => {
			if (previousTarget !== undefined && nextTarget !== previousTarget) {
				resetHovered();
			}
		},
		{ flush: "sync" },
	);
	const stopRemoval = triggerOnRemoval
		? onElementRemoval(target, () => setHovered(false), {
				document: documentTarget,
				window: windowTarget,
			})
		: undefined;

	const stop = () => {
		if (stopped) {
			return;
		}

		stopped = true;
		resetHovered();
		mouseenter.stop();
		mouseleave.stop();
		stopTargetWatch();
		stopRemoval?.();
	};

	const scope = getCurrentScope();
	if (scope !== undefined) {
		onDispose(stop, scope);
	}

	return {
		isHovered: readonly(isHovered),
		stop,
	};
}
