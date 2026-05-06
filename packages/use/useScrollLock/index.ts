import { computed, signal, watch } from "@sigrea/core";

import { defaultWindow, listen, resolveTarget } from "../../shared";
import { tryOnScopeDispose } from "../tryOnScopeDispose";
import type {
	MaybeTarget,
	UseScrollLockElement,
	UseScrollLockElementLike,
	UseScrollLockOptions,
	UseScrollLockReturn,
	UseScrollLockWindowLike,
} from "../types";

interface ScrollLockState {
	count: number;
	initialOverflow: CSSStyleDeclaration["overflow"];
}

interface ResolvedScrollLockTarget {
	element: UseScrollLockElementLike;
	window: UseScrollLockWindowLike | undefined;
}

const elementLockStates = new WeakMap<
	UseScrollLockElementLike,
	ScrollLockState
>();

function isObject(value: unknown): value is Record<PropertyKey, unknown> {
	return typeof value === "object" && value !== null;
}

function isWindowTarget(value: unknown): value is UseScrollLockWindowLike {
	return isObject(value) && isObject(value.document);
}

function isDocumentTarget(
	value: unknown,
): value is NonNullable<UseScrollLockWindowLike["document"]> {
	return isObject(value) && "documentElement" in value;
}

function isElementTarget(value: unknown): value is UseScrollLockElementLike {
	return isObject(value) && "style" in value && "tagName" in value;
}

function resolveEventElement(target: EventTarget | null): Element | undefined {
	if (isObject(target) && "tagName" in target) {
		return target as unknown as Element;
	}

	const parentElement = (target as { parentElement?: Element | null } | null)
		?.parentElement;

	return parentElement ?? undefined;
}

function resolveLockTarget<TElement extends UseScrollLockElement>(
	target: MaybeTarget<TElement>,
): ResolvedScrollLockTarget | undefined {
	const source = resolveTarget<TElement>(target);

	if (source === undefined) {
		return undefined;
	}

	if (isWindowTarget(source)) {
		const element = source.document?.documentElement;

		return element === undefined || element === null
			? undefined
			: { element, window: source };
	}

	if (isDocumentTarget(source)) {
		const element = source.documentElement;

		return element === undefined || element === null
			? undefined
			: {
					element,
					window: source.defaultView as UseScrollLockWindowLike | undefined,
				};
	}

	if (!isElementTarget(source)) {
		return undefined;
	}

	return {
		element: source,
		window: source.ownerDocument?.defaultView as
			| UseScrollLockWindowLike
			| undefined,
	};
}

function isIOS(windowTarget: UseScrollLockWindowLike | undefined): boolean {
	const navigator = windowTarget?.navigator;
	const platform = navigator?.platform ?? "";
	const userAgent = navigator?.userAgent ?? "";
	const maxTouchPoints = navigator?.maxTouchPoints ?? 0;

	return (
		/iP(?:ad|hone|od)/.test(platform) ||
		/iP(?:ad|hone|od)/.test(userAgent) ||
		(platform === "MacIntel" && maxTouchPoints > 1)
	);
}

function checkOverflowScroll(
	element: Element,
	windowTarget: UseScrollLockWindowLike | undefined,
): boolean {
	const style = windowTarget?.getComputedStyle?.(element);

	if (
		style !== undefined &&
		(style.overflowX === "scroll" ||
			style.overflowY === "scroll" ||
			(style.overflowX === "auto" &&
				element.clientWidth < element.scrollWidth) ||
			(style.overflowY === "auto" &&
				element.clientHeight < element.scrollHeight))
	) {
		return true;
	}

	const parent = element.parentNode;
	if (
		!isObject(parent) ||
		!("tagName" in parent) ||
		parent.tagName === "BODY"
	) {
		return false;
	}

	return checkOverflowScroll(parent as unknown as Element, windowTarget);
}

function preventDefault(
	event: TouchEvent,
	windowTarget: UseScrollLockWindowLike | undefined,
): boolean {
	const target = resolveEventElement(event.target);

	if (target !== undefined && checkOverflowScroll(target, windowTarget)) {
		return false;
	}

	if (event.touches.length > 1) {
		return true;
	}

	event.preventDefault();
	return false;
}

/**
 * Lock scrolling of an element.
 */
export function useScrollLock<
	TElement extends UseScrollLockElement = UseScrollLockElement,
	TWindow extends UseScrollLockWindowLike = UseScrollLockWindowLike,
>(
	target: MaybeTarget<TElement>,
	initialState = false,
	options: UseScrollLockOptions<TWindow> = {},
): UseScrollLockReturn {
	const hasWindowOption = "window" in options && options.window !== undefined;
	const windowTarget = hasWindowOption
		? options.window
		: (defaultWindow as MaybeTarget<TWindow | null | undefined> | undefined);
	const desiredLocked = signal(initialState);
	let activeElement: UseScrollLockElementLike | undefined;
	let activeWindow: UseScrollLockWindowLike | undefined;
	let stopped = false;
	let stopTouchMoveListener: (() => void) | undefined;

	const currentWindow = (
		resolvedTarget: ResolvedScrollLockTarget | undefined,
	) => {
		const configuredWindow =
			windowTarget === undefined
				? undefined
				: resolveTarget<TWindow | null | undefined>(windowTarget);

		return (
			configuredWindow ?? (hasWindowOption ? undefined : resolvedTarget?.window)
		);
	};
	const currentTarget = () => {
		const resolvedTarget = resolveLockTarget(target);

		return {
			element: resolvedTarget?.element,
			window: currentWindow(resolvedTarget),
		};
	};
	const stopTouchMove = () => {
		stopTouchMoveListener?.();
		stopTouchMoveListener = undefined;
	};
	const startTouchMove = (
		element: UseScrollLockElementLike,
		window: UseScrollLockWindowLike | undefined,
	) => {
		stopTouchMove();
		if (!isIOS(window)) {
			return;
		}

		stopTouchMoveListener = listen(
			element,
			"touchmove",
			(event) => {
				preventDefault(event as TouchEvent, window);
			},
			{ passive: false },
		);
	};
	const releaseActiveElement = () => {
		const element = activeElement;
		if (element === undefined) {
			return;
		}

		stopTouchMove();
		const state = elementLockStates.get(element);
		if (state !== undefined) {
			state.count -= 1;
			if (state.count <= 0) {
				element.style.overflow = state.initialOverflow;
				elementLockStates.delete(element);
			}
		}

		activeElement = undefined;
		activeWindow = undefined;
	};
	const acquireElement = (
		element: UseScrollLockElementLike,
		window: UseScrollLockWindowLike | undefined,
	) => {
		if (activeElement === element) {
			if (activeWindow !== window) {
				activeWindow = window;
				startTouchMove(element, window);
			}
			return;
		}

		releaseActiveElement();

		const state = elementLockStates.get(element);
		if (state === undefined) {
			elementLockStates.set(element, {
				count: 1,
				initialOverflow: element.style.overflow,
			});
		} else {
			state.count += 1;
		}

		element.style.overflow = "hidden";
		activeElement = element;
		activeWindow = window;
		startTouchMove(element, window);
	};
	const syncLock = (nextTarget = currentTarget()) => {
		if (stopped) {
			return;
		}

		if (activeElement !== undefined && activeElement !== nextTarget.element) {
			releaseActiveElement();
		}

		if (nextTarget.element === undefined) {
			return;
		}

		if (
			activeElement === undefined &&
			nextTarget.element.style.overflow === "hidden" &&
			!desiredLocked.value
		) {
			desiredLocked.value = true;
		}

		if (desiredLocked.value) {
			acquireElement(nextTarget.element, nextTarget.window);
		} else {
			releaseActiveElement();
		}
	};
	const stopWatch = watch(
		currentTarget,
		(nextTarget) => {
			syncLock(nextTarget);
		},
		{ immediate: true, flush: "sync" },
	);
	const stop = () => {
		if (stopped) {
			return;
		}

		stopped = true;
		stopWatch();
		releaseActiveElement();
		desiredLocked.value = false;
	};
	const isLocked = computed<boolean>({
		get: () => desiredLocked.value,
		set(nextValue) {
			if (stopped) {
				return;
			}

			desiredLocked.value = nextValue;
			syncLock();
		},
	}) as UseScrollLockReturn;

	Object.defineProperty(isLocked, "stop", {
		configurable: true,
		enumerable: false,
		value: stop,
	});
	tryOnScopeDispose(stop);

	return isLocked;
}
