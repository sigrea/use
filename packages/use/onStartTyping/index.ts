import { defaultDocument } from "../../shared";
import type {
	MaybeTarget,
	OnStartTypingDocumentLike,
	OnStartTypingHandler,
	OnStartTypingOptions,
	OnStartTypingReturn,
} from "../types";
import { useEventListener } from "../useEventListener";

function isEditableElement(element: Element | null | undefined): boolean {
	if (element === null || element === undefined) {
		return false;
	}

	if (element.ownerDocument?.designMode?.toLowerCase() === "on") {
		return true;
	}

	if ("isContentEditable" in element && element.isContentEditable) {
		return true;
	}

	const tagName = element.tagName;
	if (tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT") {
		return true;
	}

	let currentElement: Element | null = element;
	while (currentElement !== null) {
		const contenteditable = currentElement.getAttribute("contenteditable");
		const contenteditableValue = contenteditable?.toLowerCase();
		if (
			["", "true", "plaintext-only"].includes(contenteditableValue ?? "false")
		) {
			return true;
		}

		if (contenteditableValue === "false") {
			return false;
		}

		currentElement = currentElement.parentElement;
	}

	return false;
}

function hasModifier(event: KeyboardEvent): boolean {
	return event.metaKey || event.ctrlKey || event.altKey;
}

function isLegacyAlphaNumericKey(event: KeyboardEvent): boolean {
	const keyCode = event.keyCode;

	return (
		(keyCode >= 48 && keyCode <= 57) ||
		(keyCode >= 96 && keyCode <= 105) ||
		(keyCode >= 65 && keyCode <= 90)
	);
}

function isTypedCharValid(event: KeyboardEvent): boolean {
	if (hasModifier(event)) {
		return false;
	}

	if (event.key !== "") {
		return /^[a-z0-9]$/i.test(event.key);
	}

	return isLegacyAlphaNumericKey(event);
}

function getActiveElement(
	documentTarget: OnStartTypingDocumentLike,
): Element | null | undefined {
	return documentTarget.activeElement;
}

export function onStartTyping<
	TDocument extends OnStartTypingDocumentLike = OnStartTypingDocumentLike,
>(
	callback: OnStartTypingHandler,
	options: OnStartTypingOptions<TDocument> = {},
): OnStartTypingReturn {
	const documentTarget =
		"document" in options && options.document !== undefined
			? options.document
			: (defaultDocument as MaybeTarget<TDocument> | undefined);

	if (documentTarget === undefined) {
		return () => {};
	}

	const keydown = (event: KeyboardEvent) => {
		const currentDocument =
			(event.currentTarget as OnStartTypingDocumentLike | null) ?? undefined;
		const activeElement =
			currentDocument === undefined
				? undefined
				: getActiveElement(currentDocument);

		if (!isEditableElement(activeElement) && isTypedCharValid(event)) {
			callback(event);
		}
	};
	const subscription = useEventListener(
		documentTarget as MaybeTarget<OnStartTypingDocumentLike>,
		"keydown",
		keydown as (event: Event) => void,
		{ passive: true },
	);

	return subscription.stop;
}
