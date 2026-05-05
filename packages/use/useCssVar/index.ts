import { computed, signal, watch } from "@sigrea/core";

import { defaultWindow, resolveTarget, resolveValue } from "../../shared";
import type {
	MaybeTarget,
	MaybeValue,
	UseCssVarElementLike,
	UseCssVarOptions,
	UseCssVarReturn,
	UseCssVarWindowLike,
} from "../types";

function getMutationObserver(
	windowTarget: UseCssVarWindowLike | undefined,
	allowGlobalFallback: boolean,
): typeof MutationObserver | undefined {
	return (
		windowTarget?.MutationObserver ??
		(allowGlobalFallback ? globalThis.MutationObserver : undefined)
	);
}

function resolveElement<TWindow extends UseCssVarWindowLike>(
	target: MaybeTarget<UseCssVarElementLike> | undefined,
	windowTarget: TWindow | undefined,
): UseCssVarElementLike | undefined {
	return resolveTarget(target) ?? windowTarget?.document?.documentElement;
}

function readCssVar(
	windowTarget: UseCssVarWindowLike | undefined,
	element: UseCssVarElementLike | undefined,
	property: string | null | undefined,
): string | undefined {
	if (!element || !property) {
		return undefined;
	}

	const style =
		typeof windowTarget?.getComputedStyle === "function"
			? windowTarget.getComputedStyle(element)
			: element.style;
	const value = style?.getPropertyValue(property).trim();
	return value === "" ? undefined : value;
}

function writeCssVar(
	element: UseCssVarElementLike | undefined,
	property: string | null | undefined,
	value: string | null | undefined,
): void {
	const style = element?.style;
	if (!style || !property) {
		return;
	}

	if (value == null) {
		if (style.getPropertyValue(property) !== "") {
			style.removeProperty(property);
		}
		return;
	}

	if (style.getPropertyValue(property) !== value) {
		style.setProperty(property, value);
	}
}

export function useCssVar<
	TWindow extends UseCssVarWindowLike = UseCssVarWindowLike,
>(
	property: MaybeValue<string | null | undefined>,
	target?: MaybeTarget<UseCssVarElementLike>,
	options: UseCssVarOptions<TWindow> = {},
): UseCssVarReturn {
	const { initialValue, observe = false } = options;
	const useDefaultWindow =
		!("window" in options) || options.window === undefined;
	const windowTarget = useDefaultWindow
		? (defaultWindow as MaybeTarget<TWindow> | undefined)
		: options.window;
	const value = signal<string | null | undefined>(initialValue);

	const currentWindow = () =>
		windowTarget === undefined
			? undefined
			: resolveTarget<TWindow>(windowTarget);
	const currentElement = (windowValue = currentWindow()) =>
		resolveElement(target, windowValue);
	const currentProperty = () => resolveValue(property);
	const syncFromElement = (
		windowValue: TWindow | undefined,
		element: UseCssVarElementLike | undefined,
		nextProperty: string | null | undefined,
	) => {
		value.value =
			readCssVar(windowValue, element, nextProperty) ??
			value.value ??
			initialValue;
	};

	const stopTargetWatch = watch(
		() => {
			const windowValue = currentWindow();

			return {
				element: currentElement(windowValue),
				property: currentProperty(),
				window: windowValue,
			};
		},
		(nextValue, previousValue, onCleanup) => {
			if (previousValue?.element && previousValue.property) {
				previousValue.element.style?.removeProperty(previousValue.property);
			}

			syncFromElement(nextValue.window, nextValue.element, nextValue.property);
			writeCssVar(nextValue.element, nextValue.property, value.value);

			const MutationObserverCtor =
				observe && nextValue.element && nextValue.property
					? getMutationObserver(nextValue.window, useDefaultWindow)
					: undefined;
			if (typeof MutationObserverCtor !== "function" || !nextValue.element) {
				return;
			}

			const observer = new MutationObserverCtor(() => {
				value.value = readCssVar(
					nextValue.window,
					nextValue.element,
					nextValue.property,
				);
			});
			observer.observe(nextValue.element, {
				attributeFilter: ["style", "class"],
				attributes: true,
			});
			onCleanup(() => {
				observer.disconnect();
			});
		},
		{ immediate: true, flush: "sync" },
	);

	const stopValueWatch = watch(
		() => value.value,
		(nextValue) => {
			writeCssVar(currentElement(), currentProperty(), nextValue);
		},
		{ flush: "sync" },
	);

	const variable = computed<string | null | undefined>({
		get: () => value.value,
		set(nextValue) {
			value.value = nextValue;
			writeCssVar(currentElement(), currentProperty(), nextValue);
		},
	}) as UseCssVarReturn;
	Object.defineProperty(variable, "stop", {
		configurable: true,
		enumerable: false,
		value: () => {
			stopValueWatch();
			stopTargetWatch();
		},
	});

	return variable;
}
