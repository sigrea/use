import { readonly, signal, watch } from "@sigrea/core";
import {
	defaultDocument,
	defaultWindow,
	resolveTarget,
	resolveValue,
} from "../../shared";
import { bindAutoStart } from "../internal";
import type {
	MaybeTarget,
	UseElementByPointDocumentLike,
	UseElementByPointElement,
	UseElementByPointOptions,
	UseElementByPointReturn,
	UseElementByPointScheduler,
	UseElementByPointWindowLike,
	UseIntervalFnReturn,
} from "../types";
import { useIntervalFn } from "../useIntervalFn";

function resolveMultiple<Multiple extends boolean>(
	multiple: UseElementByPointOptions<Multiple>["multiple"],
): boolean {
	return Boolean(resolveValue(multiple ?? false));
}

function emptyElement<Multiple extends boolean, TElement extends Element>(
	multiple: boolean,
): UseElementByPointElement<Multiple, TElement> {
	return (multiple ? [] : null) as UseElementByPointElement<Multiple, TElement>;
}

function isPointLookupSupported(
	documentTarget: UseElementByPointDocumentLike | null | undefined,
	multiple: boolean,
): boolean {
	return multiple
		? typeof documentTarget?.elementsFromPoint === "function"
		: typeof documentTarget?.elementFromPoint === "function";
}

function readElement<Multiple extends boolean, TElement extends Element>(
	documentTarget: UseElementByPointDocumentLike,
	multiple: boolean,
	x: number,
	y: number,
): UseElementByPointElement<Multiple, TElement> {
	return (
		multiple
			? (documentTarget.elementsFromPoint?.(x, y) ?? [])
			: (documentTarget.elementFromPoint?.(x, y) ?? null)
	) as UseElementByPointElement<Multiple, TElement>;
}

function getRequestAnimationFrame(
	windowTarget: UseElementByPointWindowLike | undefined,
	allowGlobalFallback: boolean,
): UseElementByPointWindowLike["requestAnimationFrame"] | undefined {
	return (
		windowTarget?.requestAnimationFrame ??
		(allowGlobalFallback ? globalThis.requestAnimationFrame : undefined)
	);
}

function getCancelAnimationFrame(
	windowTarget: UseElementByPointWindowLike | undefined,
	allowGlobalFallback: boolean,
): UseElementByPointWindowLike["cancelAnimationFrame"] | undefined {
	return (
		windowTarget?.cancelAnimationFrame ??
		(allowGlobalFallback ? globalThis.cancelAnimationFrame : undefined)
	);
}

function createRafScheduler(
	callback: () => void,
	getWindow: () => UseElementByPointWindowLike | undefined,
	allowGlobalFallback: boolean,
	immediate: boolean,
): UseIntervalFnReturn {
	const active = signal(false);
	let frameHandle: number | undefined;
	let frameWindow: UseElementByPointWindowLike | undefined;
	let stopWatchingWindow: (() => void) | undefined;

	const clearFrame = () => {
		if (frameHandle === undefined) {
			return;
		}

		const cancelFrame = getCancelAnimationFrame(
			frameWindow,
			allowGlobalFallback,
		);
		if (typeof cancelFrame === "function") {
			cancelFrame.call(frameWindow ?? globalThis, frameHandle);
		}
		frameHandle = undefined;
		frameWindow = undefined;
	};

	const stopWatching = () => {
		stopWatchingWindow?.();
		stopWatchingWindow = undefined;
	};

	const scheduleFrame = () => {
		if (!active.value || frameHandle !== undefined) {
			return;
		}

		const windowValue = getWindow();
		const requestFrame = getRequestAnimationFrame(
			windowValue,
			allowGlobalFallback,
		);
		if (typeof requestFrame !== "function") {
			callback();
			if (allowGlobalFallback) {
				active.value = false;
				stopWatching();
			}
			return;
		}

		frameWindow = windowValue;
		frameHandle = requestFrame.call(windowValue ?? globalThis, () => {
			frameHandle = undefined;
			frameWindow = undefined;

			if (!active.value) {
				return;
			}

			callback();
			scheduleFrame();
		});
	};

	const startWatchingWindow = () => {
		if (stopWatchingWindow !== undefined) {
			return;
		}

		stopWatchingWindow = watch(
			getWindow,
			() => {
				if (!active.value) {
					return;
				}

				clearFrame();
				scheduleFrame();
			},
			{ flush: "sync" },
		);
	};

	const pause = () => {
		active.value = false;
		stopWatching();
		clearFrame();
	};

	const resume = () => {
		if (active.value) {
			return;
		}

		active.value = true;
		startWatchingWindow();
		scheduleFrame();
	};

	bindAutoStart(resume, pause, immediate);

	return {
		isActive: readonly(active),
		pause,
		resume,
	};
}

/**
 * Reactive element by viewport-relative point.
 *
 * @param options Point lookup options.
 */
export function useElementByPoint<
	Multiple extends boolean = false,
	TElement extends Element = Element,
	TDocument extends
		UseElementByPointDocumentLike = UseElementByPointDocumentLike,
	TWindow extends UseElementByPointWindowLike = UseElementByPointWindowLike,
>(
	options: UseElementByPointOptions<Multiple, TDocument, TWindow>,
): UseElementByPointReturn<Multiple, TElement> {
	const { x, y } = options;
	const hasDocumentOption =
		"document" in options && options.document !== undefined;
	const hasWindowOption = "window" in options && options.window !== undefined;
	const documentTarget = hasDocumentOption ? options.document : undefined;
	const windowTarget = hasWindowOption ? options.window : undefined;
	const allowGlobalWindowFallback = !hasDocumentOption && !hasWindowOption;
	const supported = signal(false);
	const multiple = () => resolveMultiple(options.multiple);
	const element = signal<UseElementByPointElement<Multiple, TElement>>(
		emptyElement<Multiple, TElement>(multiple()),
	);
	let stopped = false;
	let isSchedulerActive = () => true;

	const currentWindow = (): UseElementByPointWindowLike | undefined => {
		if (hasWindowOption) {
			return windowTarget === undefined
				? undefined
				: resolveTarget<TWindow>(windowTarget);
		}

		if (hasDocumentOption) {
			const documentValue =
				documentTarget === undefined
					? undefined
					: resolveTarget<TDocument>(documentTarget);
			return documentValue?.defaultView ?? undefined;
		}

		return defaultWindow as UseElementByPointWindowLike | undefined;
	};

	const currentDocument = (): UseElementByPointDocumentLike | undefined => {
		if (hasDocumentOption) {
			return documentTarget === undefined
				? undefined
				: resolveTarget<TDocument>(documentTarget);
		}

		if (hasWindowOption) {
			return currentWindow()?.document;
		}

		return defaultDocument as UseElementByPointDocumentLike | undefined;
	};

	const syncSupport = () => {
		const documentValue = currentDocument();
		const multipleValue = multiple();
		const nextSupported = isPointLookupSupported(documentValue, multipleValue);
		supported.value = nextSupported;

		if (!nextSupported || documentValue === undefined) {
			element.value = emptyElement<Multiple, TElement>(multipleValue);
			return undefined;
		}

		return { document: documentValue, multiple: multipleValue };
	};

	const update = () => {
		const support = syncSupport();
		if (support === undefined) {
			return;
		}

		element.value = readElement<Multiple, TElement>(
			support.document,
			support.multiple,
			resolveValue(x),
			resolveValue(y),
		);
	};

	const createScheduler: UseElementByPointScheduler =
		options.scheduler ??
		((callback) => {
			const interval = resolveValue(
				options.interval ?? "requestAnimationFrame",
			);

			return interval === "requestAnimationFrame"
				? createRafScheduler(
						callback,
						currentWindow,
						allowGlobalWindowFallback,
						options.immediate ?? true,
					)
				: useIntervalFn(callback, options.interval as number, {
						immediate: options.immediate ?? true,
					});
		});

	const schedulerCallback = () => {
		if (stopped || !isSchedulerActive()) {
			return;
		}

		update();
	};
	const controls = createScheduler(schedulerCallback);
	isSchedulerActive = () => controls.isActive.value;

	const pause = () => {
		controls.pause();
	};

	const resume = () => {
		if (stopped) {
			return;
		}

		controls.resume();
	};

	const stop = () => {
		if (stopped) {
			return;
		}

		stopped = true;
		pause();
	};

	syncSupport();
	try {
		bindAutoStart(resume, pause, false);
	} catch {}

	return {
		element: readonly(element),
		isSupported: readonly(supported),
		isActive: controls.isActive,
		pause,
		resume,
		stop,
		update,
	};
}
