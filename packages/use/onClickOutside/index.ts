import { getCurrentScope, onDispose } from "@sigrea/core";
import { defaultWindow, resolveTarget, resolveValue } from "../../shared";
import type {
	Arrayable,
	MaybeTarget,
	OnClickOutsideControlsReturn,
	OnClickOutsideHandler,
	OnClickOutsideIgnoreTarget,
	OnClickOutsideOptions,
	OnClickOutsideReturn,
	OnClickOutsideWindowLike,
} from "../types";
import { useEventListener } from "../useEventListener";

function toArray<T>(value: Arrayable<T> | null | undefined): T[] {
	if (value === undefined || value === null) {
		return [];
	}

	return Array.isArray(value) ? [...value] : [value as T];
}

function getEventPath(event: Event): EventTarget[] {
	if (typeof event.composedPath === "function") {
		return event.composedPath();
	}

	return event.target === null ? [] : [event.target];
}

function containsTarget(element: Element, target: EventTarget | null): boolean {
	if (target === null) {
		return false;
	}

	try {
		return element.contains(target as Node);
	} catch {
		return false;
	}
}

function isEventInside(element: Element, event: Event): boolean {
	const path = getEventPath(event);

	return path.includes(element) || containsTarget(element, event.target);
}

function querySelectorAll(
	windowTarget: OnClickOutsideWindowLike | undefined,
	selector: string,
): Element[] {
	const documentTarget = windowTarget?.document;
	if (typeof documentTarget?.querySelectorAll !== "function") {
		return [];
	}

	return Array.from(documentTarget.querySelectorAll(selector));
}

function getActiveElement(
	documentTarget: OnClickOutsideWindowLike["document"] | undefined,
): Element | null | undefined {
	let activeElement = documentTarget?.activeElement;
	while (
		activeElement !== null &&
		activeElement !== undefined &&
		"shadowRoot" in activeElement &&
		activeElement.shadowRoot?.activeElement
	) {
		activeElement = activeElement.shadowRoot.activeElement;
	}

	return activeElement;
}

interface ScheduledTask {
	clear(): void;
}

function schedule(
	windowTarget: OnClickOutsideWindowLike | undefined,
	callback: () => void,
): ScheduledTask {
	const setTimeoutFn = windowTarget?.setTimeout ?? globalThis.setTimeout;
	const clearTimeoutFn = windowTarget?.clearTimeout ?? globalThis.clearTimeout;
	const timer = setTimeoutFn(callback, 0);

	return {
		clear: () => {
			clearTimeoutFn(timer);
		},
	};
}

export function onClickOutside<TOptions extends OnClickOutsideOptions<false>>(
	target: MaybeTarget<Element>,
	handler: OnClickOutsideHandler,
	options?: TOptions,
): () => void;

export function onClickOutside<TOptions extends OnClickOutsideOptions<true>>(
	target: MaybeTarget<Element>,
	handler: OnClickOutsideHandler,
	options: TOptions,
): OnClickOutsideControlsReturn;

export function onClickOutside<TOptions extends OnClickOutsideOptions<boolean>>(
	target: MaybeTarget<Element>,
	handler: OnClickOutsideHandler,
	options: TOptions = {} as TOptions,
): OnClickOutsideReturn<boolean> {
	const {
		ignore = [],
		capture = true,
		detectIframe = false,
		controls = false,
	} = options;
	const windowTarget =
		"window" in options && options.window !== undefined
			? options.window
			: (defaultWindow as MaybeTarget<OnClickOutsideWindowLike> | undefined);
	let shouldListen = true;
	let isProcessingClick = false;
	let canceledNextClick = false;
	let stopped = false;
	let clickTimer: ScheduledTask | undefined;
	let iframeTimer: ScheduledTask | undefined;

	const currentWindow = () =>
		windowTarget === undefined
			? undefined
			: resolveTarget<OnClickOutsideWindowLike>(windowTarget);

	const clearIframeTimer = () => {
		if (iframeTimer !== undefined) {
			iframeTimer.clear();
			iframeTimer = undefined;
		}
	};

	const clearClickTimer = () => {
		if (clickTimer !== undefined) {
			clickTimer.clear();
			clickTimer = undefined;
		}
		isProcessingClick = false;
	};

	const shouldIgnore = (event: Event) => {
		return toArray(resolveValue(ignore)).some((ignoreTarget) => {
			if (typeof ignoreTarget === "string") {
				return querySelectorAll(currentWindow(), ignoreTarget).some((element) =>
					isEventInside(element, event),
				);
			}

			const element = resolveTarget<Element>(
				ignoreTarget as Exclude<OnClickOutsideIgnoreTarget, string>,
			);

			return element ? isEventInside(element, event) : false;
		});
	};

	const listener = (event: Event) => {
		if (stopped) {
			return;
		}

		const element = resolveTarget(target);
		if (event.target === null || !element || isEventInside(element, event)) {
			return;
		}

		if ("detail" in event && event.detail === 0) {
			shouldListen = !shouldIgnore(event);
		}

		if (!shouldListen) {
			shouldListen = true;
			return;
		}

		handler(event);
	};

	const click = useEventListener(
		windowTarget,
		"click",
		(event) => {
			if (canceledNextClick) {
				canceledNextClick = false;
				shouldListen = true;
				return;
			}

			if (isProcessingClick) {
				return;
			}

			isProcessingClick = true;
			clickTimer = schedule(currentWindow(), () => {
				clickTimer = undefined;
				isProcessingClick = false;
			});
			listener(event);
		},
		{ capture, passive: true },
	);

	const pointerDown = useEventListener(
		windowTarget,
		"pointerdown",
		(event) => {
			if (canceledNextClick) {
				return;
			}

			const element = resolveTarget(target);
			shouldListen =
				!shouldIgnore(event) &&
				Boolean(element && !isEventInside(element, event));
		},
		{ passive: true },
	);

	const blur = detectIframe
		? useEventListener(
				windowTarget,
				"blur",
				(event) => {
					clearIframeTimer();
					iframeTimer = schedule(currentWindow(), () => {
						if (stopped) {
							return;
						}
						const windowValue = currentWindow();
						const documentTarget = windowValue?.document;
						const activeElement = getActiveElement(documentTarget);
						const element = resolveTarget(target);
						const documentActiveElement = documentTarget?.activeElement ?? null;

						if (
							activeElement?.tagName === "IFRAME" &&
							!(element && containsTarget(element, documentActiveElement))
						) {
							handler(event);
						}
					});
				},
				{ passive: true },
			)
		: undefined;

	const stop = () => {
		stopped = true;
		clearClickTimer();
		clearIframeTimer();
		click.stop();
		pointerDown.stop();
		blur?.stop();
	};

	const scope = getCurrentScope();
	if (scope !== undefined) {
		onDispose(stop, scope);
	}

	if (controls) {
		return {
			stop,
			cancel: () => {
				clearClickTimer();
				clearIframeTimer();
				canceledNextClick = true;
				shouldListen = false;
			},
			trigger: (event: Event) => {
				canceledNextClick = false;
				shouldListen = true;
				listener(event);
				shouldListen = false;
			},
		};
	}

	return stop;
}
