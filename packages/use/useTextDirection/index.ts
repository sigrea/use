import { computed, signal, watch } from "@sigrea/core";

import { defaultDocument, resolveTarget, resolveValue } from "../../shared";
import { tryOnScopeDispose } from "../tryOnScopeDispose";
import type {
	MaybeTarget,
	UseMutationObserverWindowLike,
	UseTextDirectionDocumentLike,
	UseTextDirectionOptions,
	UseTextDirectionReturn,
	UseTextDirectionValue,
} from "../types";
import { useMutationObserver } from "../useMutationObserver";

const defaultSelector = "html";
const defaultInitialValue: UseTextDirectionValue = "ltr";

function queryDirectionElement(
	document: UseTextDirectionDocumentLike | undefined,
	selector: string,
): Element | undefined {
	if (typeof document?.querySelector !== "function") {
		return undefined;
	}

	try {
		return document.querySelector(selector) ?? undefined;
	} catch {
		return undefined;
	}
}

function isTextDirectionValue(
	value: string | null,
): value is UseTextDirectionValue {
	return value === "ltr" || value === "rtl" || value === "auto";
}

function normalizeTextDirectionValue(
	value: string | null,
): UseTextDirectionValue | undefined {
	const normalized = value?.toLowerCase() ?? null;

	return isTextDirectionValue(normalized) ? normalized : undefined;
}

function readDirection(
	document: UseTextDirectionDocumentLike | undefined,
	selector: string,
	initialValue: UseTextDirectionValue,
): UseTextDirectionValue {
	const value =
		queryDirectionElement(document, selector)?.getAttribute("dir") ?? null;

	return normalizeTextDirectionValue(value) ?? initialValue;
}

function writeDirection(
	document: UseTextDirectionDocumentLike | undefined,
	selector: string,
	value: UseTextDirectionValue,
): void {
	const element = queryDirectionElement(document, selector);
	if (element === undefined) {
		return;
	}

	if (value) {
		element.setAttribute("dir", value);
		return;
	}

	element.removeAttribute("dir");
}

export function useTextDirection<
	TDocument extends UseTextDirectionDocumentLike = UseTextDirectionDocumentLike,
>(options: UseTextDirectionOptions<TDocument> = {}): UseTextDirectionReturn {
	const {
		initialValue = defaultInitialValue,
		observe = false,
		selector = defaultSelector,
	} = options;
	const useDefaultDocument =
		!("document" in options) || options.document === undefined;
	const documentTarget = useDefaultDocument
		? (defaultDocument as MaybeTarget<TDocument | null | undefined> | undefined)
		: options.document;
	const direction = signal<UseTextDirectionValue>(
		resolveValue(initialValue) ?? defaultInitialValue,
	);
	let stopped = false;

	const currentDocument = () =>
		documentTarget === undefined
			? undefined
			: resolveTarget<TDocument | null | undefined>(documentTarget);
	const currentInitialValue = () =>
		resolveValue(initialValue) ?? defaultInitialValue;
	const currentSelector = () => resolveValue(selector) ?? defaultSelector;

	const mutationObserver = useMutationObserver(
		() => {
			if (!resolveValue(observe)) {
				return undefined;
			}

			return queryDirectionElement(currentDocument(), currentSelector());
		},
		() => {
			direction.value = readDirection(
				currentDocument(),
				currentSelector(),
				currentInitialValue(),
			);
		},
		{
			attributes: true,
			window: () =>
				(currentDocument()?.defaultView as
					| UseMutationObserverWindowLike
					| null
					| undefined) ?? null,
		},
	);

	const stopDocumentWatch = watch(
		() => {
			const document = currentDocument();
			const nextSelector = currentSelector();

			return {
				document,
				initialValue: currentInitialValue(),
				observe: resolveValue(observe),
				selector: nextSelector,
				target: queryDirectionElement(document, nextSelector),
			};
		},
		(nextValue) => {
			direction.value = readDirection(
				nextValue.document,
				nextValue.selector,
				nextValue.initialValue,
			);
		},
		{ immediate: true, flush: "sync" },
	);

	const textDirection = computed<UseTextDirectionValue>({
		get: () => direction.value,
		set(nextValue) {
			direction.value = nextValue;
			if (stopped) {
				return;
			}

			writeDirection(currentDocument(), currentSelector(), nextValue);
		},
	}) as UseTextDirectionReturn;
	Object.defineProperty(textDirection, "stop", {
		configurable: true,
		enumerable: false,
		value: () => {
			if (stopped) {
				return;
			}

			stopped = true;
			stopDocumentWatch();
			mutationObserver.stop();
		},
	});

	tryOnScopeDispose(textDirection.stop);

	return textDirection;
}
