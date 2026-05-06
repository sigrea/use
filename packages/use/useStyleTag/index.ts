import { onMount, readonly, signal, watch } from "@sigrea/core";

import { defaultDocument, resolveTarget, resolveValue } from "../../shared";
import { tryOnScopeDispose } from "../tryOnScopeDispose";
import type {
	MaybeTarget,
	MaybeValue,
	UseStyleTagDocumentLike,
	UseStyleTagOptions,
	UseStyleTagReturn,
} from "../types";

interface StyleSnapshot {
	media: string | null;
	nonce: string | null;
	textContent: string | null;
}

let styleId = 0;

function isUsableDocument(
	document: UseStyleTagDocumentLike | null | undefined,
): document is UseStyleTagDocumentLike & { readonly head: HTMLHeadElement } {
	return (
		document?.head !== null &&
		document?.head !== undefined &&
		typeof document.createElement === "function" &&
		typeof document.getElementById === "function"
	);
}

function findStyle(
	document: UseStyleTagDocumentLike,
	id: string,
): HTMLStyleElement | null {
	const element = document.getElementById(id);

	return element?.tagName.toLowerCase() === "style"
		? (element as HTMLStyleElement)
		: null;
}

function readSnapshot(style: HTMLStyleElement): StyleSnapshot {
	return {
		media: style.getAttribute("media"),
		nonce: style.hasAttribute("nonce") ? (style.nonce ?? "") : null,
		textContent: style.textContent,
	};
}

function restoreSnapshot(
	style: HTMLStyleElement,
	snapshot: StyleSnapshot,
): void {
	style.textContent = snapshot.textContent;
	if (snapshot.media === null) {
		style.removeAttribute("media");
	} else {
		style.setAttribute("media", snapshot.media);
	}
	if (snapshot.nonce === null) {
		style.nonce = "";
		style.removeAttribute("nonce");
	} else {
		style.nonce = snapshot.nonce;
	}
}

/**
 * Injects a reactive `<style>` element in the document head.
 */
export function useStyleTag<
	TDocument extends UseStyleTagDocumentLike = UseStyleTagDocumentLike,
>(
	css: MaybeValue<string>,
	options: UseStyleTagOptions<TDocument> = {},
): UseStyleTagReturn {
	const {
		immediate = true,
		manual = false,
		id = `sigrea_style_tag_${++styleId}`,
		media,
		nonce,
	} = options;
	const documentTarget =
		"document" in options && options.document !== undefined
			? options.document
			: (defaultDocument as MaybeTarget<TDocument> | undefined);
	const cssSignal = signal(resolveValue(css));
	const isLoaded = signal(false);
	let managedDocument: UseStyleTagDocumentLike | undefined;
	let managedStyle: HTMLStyleElement | null = null;
	let managedSnapshot: StyleSnapshot | null = null;
	let createdStyle: HTMLStyleElement | null = null;
	let stopCssWatch: (() => void) | undefined;
	let loadRequested = false;

	const currentDocument = () =>
		documentTarget === undefined
			? undefined
			: resolveTarget<TDocument | null | undefined>(documentTarget);
	const applyOptions = (style: HTMLStyleElement) => {
		if (media !== undefined) {
			style.media = media;
		}
		if (nonce !== undefined) {
			style.nonce = nonce;
		}
	};
	const stopStyleWatch = () => {
		stopCssWatch?.();
		stopCssWatch = undefined;
	};
	const cleanupManagedStyle = () => {
		stopStyleWatch();

		if (managedStyle !== null) {
			if (managedStyle === createdStyle) {
				managedStyle.remove();
			} else if (managedSnapshot !== null) {
				restoreSnapshot(managedStyle, managedSnapshot);
			}
		}

		createdStyle = null;
		managedDocument = undefined;
		managedSnapshot = null;
		managedStyle = null;
		isLoaded.value = false;
	};
	const ensureStyle = (
		document: UseStyleTagDocumentLike & { readonly head: HTMLHeadElement },
	) => {
		let style = findStyle(document, id);
		if (style === null) {
			style = document.createElement("style");
			style.id = id;
			createdStyle = style;
			document.head.appendChild(style);
		} else {
			managedSnapshot = readSnapshot(style);
		}

		managedDocument = document;
		managedStyle = style;
		applyOptions(style);
		return style;
	};
	const loadCurrentDocument = () => {
		const document = currentDocument();

		if (!isUsableDocument(document)) {
			cleanupManagedStyle();
			return;
		}

		if (
			isLoaded.value &&
			managedDocument === document &&
			managedStyle !== null
		) {
			applyOptions(managedStyle);
			managedStyle.textContent = cssSignal.value;
			return;
		}

		cleanupManagedStyle();
		const style = ensureStyle(document);

		stopCssWatch = watch(
			() => cssSignal.value,
			(value) => {
				style.textContent = value;
			},
			{ flush: "sync", immediate: true },
		);
		isLoaded.value = true;
	};
	const load = () => {
		loadRequested = true;
		loadCurrentDocument();
	};
	const unload = () => {
		loadRequested = false;
		if (!isLoaded.value && managedStyle === null) {
			return;
		}

		cleanupManagedStyle();
	};

	watch(
		() => resolveValue(css),
		(value) => {
			cssSignal.value = value;
		},
		{ flush: "sync", immediate: true },
	);
	watch(
		currentDocument,
		(document, previousDocument) => {
			if (!loadRequested || document === previousDocument) {
				return;
			}

			loadCurrentDocument();
		},
		{ flush: "sync", immediate: false },
	);

	if (!manual) {
		let waitsForMount = false;
		try {
			onMount(() => {
				if (immediate) {
					load();
				}

				return unload;
			});
			waitsForMount = true;
		} catch {}

		if (!waitsForMount && immediate) {
			load();
		}
		tryOnScopeDispose(unload);
	}

	return {
		id,
		css: cssSignal,
		load,
		unload,
		isLoaded: readonly(isLoaded),
	};
}
