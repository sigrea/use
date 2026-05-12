import { isComputed, isSignal, nextTick, signal, watch } from "@sigrea/core";
import type { Signal, WatchSource, WatchStopHandle } from "@sigrea/core";

import {
	defaultWindow,
	listen,
	resolveTarget,
	resolveValue,
} from "../../shared";
import { tryOnScopeDispose } from "../tryOnScopeDispose";
import type {
	MaybeTarget,
	MaybeValue,
	UseTextareaAutosizeOptions,
	UseTextareaAutosizeReturn,
	UseTextareaAutosizeWindowLike,
} from "../types";
import { useResizeObserver } from "../useResizeObserver";

function getValueDescriptor(source: object): PropertyDescriptor | undefined {
	let current: object | null = source;

	while (current !== null) {
		const descriptor = Object.getOwnPropertyDescriptor(current, "value");
		if (descriptor !== undefined) {
			return descriptor;
		}

		current = Object.getPrototypeOf(current);
	}
}

function isWritableSignalSource<T>(source: unknown): source is Signal<T> {
	return (
		typeof source === "object" &&
		source !== null &&
		isSignal(source) &&
		!isComputed(source) &&
		typeof getValueDescriptor(source)?.set === "function"
	);
}

function createTargetSignal<TTarget>(
	source: MaybeTarget<TTarget | null | undefined> | undefined,
): Signal<TTarget | null | undefined> {
	if (isWritableSignalSource<TTarget | null | undefined>(source)) {
		return source;
	}

	return signal(
		source === undefined ? undefined : resolveTarget<TTarget>(source),
	);
}

function createInputSignal(
	source: MaybeValue<string> | undefined,
	fallback: string,
): Signal<string> {
	if (isWritableSignalSource<string>(source)) {
		return source;
	}

	return signal(source === undefined ? fallback : resolveValue(source));
}

function watchAdditionalSources(
	source: UseTextareaAutosizeOptions["watch"],
	callback: () => void,
): WatchStopHandle | undefined {
	if (source === undefined) {
		return undefined;
	}

	if (Array.isArray(source)) {
		return watch(source as readonly WatchSource[], callback, {
			deep: true,
			flush: "sync",
			immediate: true,
		});
	}

	return watch(source as WatchSource, callback, {
		deep: true,
		flush: "sync",
		immediate: true,
	});
}

export function useTextareaAutosize<
	TTextarea extends HTMLTextAreaElement = HTMLTextAreaElement,
	TStyleTarget extends HTMLElement = HTMLElement,
	TWindow extends UseTextareaAutosizeWindowLike = UseTextareaAutosizeWindowLike,
>(
	options: UseTextareaAutosizeOptions<TTextarea, TStyleTarget, TWindow> = {},
): UseTextareaAutosizeReturn<TTextarea> {
	const {
		element,
		maxHeight,
		onResize,
		styleProp = "height",
		styleTarget,
	} = options;
	const hasWindowOption = "window" in options && options.window !== undefined;
	const windowTarget = hasWindowOption
		? options.window
		: (defaultWindow as MaybeTarget<TWindow | null | undefined> | undefined);
	const initialTextarea =
		element === undefined ? undefined : resolveTarget<TTextarea>(element);
	const textarea = createTargetSignal<TTextarea>(element);
	const input = createInputSignal(options.input, initialTextarea?.value ?? "");
	const stops: WatchStopHandle[] = [];
	let stopped = false;
	let textareaScrollHeight = 1;
	let textareaOldWidth = 0;
	let pendingWidth: number | undefined;
	let frameHandle: number | undefined;
	let frameWindow: TWindow | null | undefined;

	const currentWindow = (): TWindow | null | undefined => {
		if (windowTarget === undefined) {
			return undefined;
		}

		return resolveValue(windowTarget);
	};
	const scheduleTriggerResize = (): void => {
		void nextTick(() => {
			if (!stopped) {
				triggerResize();
			}
		});
	};

	const cancelPendingFrame = (): void => {
		if (frameHandle === undefined) {
			return;
		}

		const cancelAnimationFrame = frameWindow?.cancelAnimationFrame;
		if (typeof cancelAnimationFrame === "function") {
			cancelAnimationFrame.call(frameWindow, frameHandle);
		}

		frameHandle = undefined;
		frameWindow = undefined;
		pendingWidth = undefined;
	};

	const triggerResize = (): void => {
		const target = textarea.value;
		if (target === undefined || target === null) {
			return;
		}

		if (target.value !== input.value) {
			target.value = input.value;
		}

		let height = "";
		target.style[styleProp] = "1px";
		const nextScrollHeight = target.scrollHeight;
		const styleHeight =
			maxHeight == null
				? `${nextScrollHeight}px`
				: `${Math.min(nextScrollHeight, maxHeight)}px`;
		const resolvedStyleTarget =
			styleTarget === undefined
				? undefined
				: resolveTarget<TStyleTarget>(styleTarget);

		if (resolvedStyleTarget !== undefined) {
			resolvedStyleTarget.style[styleProp] = styleHeight;
			if (Object.is(resolvedStyleTarget, target)) {
				height = styleHeight;
			}
		} else {
			height = styleHeight;
		}

		target.style[styleProp] = height;

		if (!Object.is(textareaScrollHeight, nextScrollHeight)) {
			textareaScrollHeight = nextScrollHeight;
			onResize?.();
		}
	};

	const queueResizeForWidth = (width: number): void => {
		pendingWidth = width;
		if (frameHandle !== undefined) {
			return;
		}

		const windowValue = currentWindow();
		const requestAnimationFrame = windowValue?.requestAnimationFrame;
		if (typeof requestAnimationFrame !== "function") {
			textareaOldWidth = pendingWidth;
			pendingWidth = undefined;
			triggerResize();
			return;
		}

		frameWindow = windowValue;
		frameHandle = requestAnimationFrame.call(windowValue, () => {
			frameHandle = undefined;
			frameWindow = undefined;
			if (stopped) {
				pendingWidth = undefined;
				return;
			}

			textareaOldWidth = pendingWidth ?? textareaOldWidth;
			pendingWidth = undefined;
			triggerResize();
		});
	};

	if (
		element !== undefined &&
		!isWritableSignalSource<TTextarea | null | undefined>(element)
	) {
		stops.push(
			watch(
				() => resolveTarget<TTextarea>(element),
				(nextTextarea) => {
					textarea.value = nextTextarea;
				},
				{ flush: "sync", immediate: true },
			),
		);
	}

	if (
		options.input !== undefined &&
		!isWritableSignalSource<string>(options.input)
	) {
		stops.push(
			watch(
				() => resolveValue(options.input as MaybeValue<string>),
				(nextInput) => {
					input.value = nextInput;
				},
				{ flush: "sync", immediate: true },
			),
		);
	}

	stops.push(
		watch(
			() => ({
				input: input.value,
				styleTarget:
					styleTarget === undefined
						? undefined
						: resolveTarget<TStyleTarget>(styleTarget),
				textarea: textarea.value,
			}),
			() => {
				scheduleTriggerResize();
			},
			{ flush: "sync", immediate: true },
		),
		watch(
			textarea,
			(nextTextarea, _previousTextarea, onCleanup) => {
				if (nextTextarea === undefined || nextTextarea === null) {
					return;
				}

				onCleanup(
					listen(nextTextarea, "input", () => {
						input.value = nextTextarea.value;
					}),
				);
			},
			{ flush: "sync", immediate: true },
		),
	);

	const resizeObserver = useResizeObserver(
		textarea,
		([{ contentRect }]) => {
			if (Object.is(textareaOldWidth, contentRect.width)) {
				return;
			}

			queueResizeForWidth(contentRect.width);
		},
		{ window: windowTarget },
	);
	stops.push(resizeObserver.stop);

	const stopAdditionalWatch = watchAdditionalSources(options.watch, () => {
		scheduleTriggerResize();
	});
	if (stopAdditionalWatch !== undefined) {
		stops.push(stopAdditionalWatch);
	}

	const stop = (): void => {
		if (stopped) {
			return;
		}

		stopped = true;
		cancelPendingFrame();
		for (const stopWatch of stops) {
			stopWatch();
		}
	};
	tryOnScopeDispose(stop);

	return {
		input,
		stop,
		textarea,
		triggerResize,
	};
}
