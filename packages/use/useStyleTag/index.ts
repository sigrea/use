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

interface StyleOwner {
	css: () => string;
	media: string | null;
	nonce: string | null;
}

interface StyleEntry {
	created: boolean;
	owners: StyleOwner[];
	originalSnapshot: StyleSnapshot | null;
	style: HTMLStyleElement;
}

let styleId = 0;
const styleRegistry = new WeakMap<
	UseStyleTagDocumentLike,
	Map<string, StyleEntry>
>();

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

function registryFor(
	document: UseStyleTagDocumentLike,
): Map<string, StyleEntry> {
	let registry = styleRegistry.get(document);
	if (registry === undefined) {
		registry = new Map();
		styleRegistry.set(document, registry);
	}

	return registry;
}

function applyOwner(style: HTMLStyleElement, owner: StyleOwner): void {
	restoreSnapshot(style, {
		media: owner.media,
		nonce: owner.nonce,
		textContent: owner.css(),
	});
}

function activeOwner(entry: StyleEntry): StyleOwner | undefined {
	return entry.owners.at(-1);
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
	let managedEntry: StyleEntry | null = null;
	let managedOwner: StyleOwner | null = null;
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

		if (
			managedDocument !== undefined &&
			managedEntry !== null &&
			managedOwner !== null
		) {
			const ownerIndex = managedEntry.owners.indexOf(managedOwner);
			if (ownerIndex !== -1) {
				managedEntry.owners.splice(ownerIndex, 1);
			}

			const nextOwner = activeOwner(managedEntry);
			if (nextOwner !== undefined) {
				applyOwner(managedEntry.style, nextOwner);
			} else {
				if (managedEntry.created) {
					managedEntry.style.remove();
				} else if (managedEntry.originalSnapshot !== null) {
					restoreSnapshot(managedEntry.style, managedEntry.originalSnapshot);
				}
				registryFor(managedDocument).delete(id);
			}
		}

		managedDocument = undefined;
		managedEntry = null;
		managedOwner = null;
		isLoaded.value = false;
	};
	const ensureStyle = (
		document: UseStyleTagDocumentLike & { readonly head: HTMLHeadElement },
	) => {
		const registry = registryFor(document);
		let entry = registry.get(id);
		if (entry === undefined) {
			let style = findStyle(document, id);
			let created = false;
			let originalSnapshot: StyleSnapshot | null = null;

			if (style === null) {
				style = document.createElement("style");
				style.id = id;
				created = true;
				document.head.appendChild(style);
			} else {
				originalSnapshot = readSnapshot(style);
			}

			entry = {
				created,
				owners: [],
				originalSnapshot,
				style,
			};
			registry.set(id, entry);
		}

		const owner: StyleOwner = {
			css: () => cssSignal.value,
			media: media ?? readSnapshot(entry.style).media,
			nonce: nonce ?? readSnapshot(entry.style).nonce,
		};
		entry.owners.push(owner);
		managedDocument = document;
		managedEntry = entry;
		managedOwner = owner;
		applyOptions(entry.style);
		return entry;
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
			managedEntry !== null &&
			managedOwner !== null
		) {
			if (activeOwner(managedEntry) === managedOwner) {
				applyOwner(managedEntry.style, managedOwner);
			}
			return;
		}

		cleanupManagedStyle();
		const entry = ensureStyle(document);

		stopCssWatch = watch(
			() => cssSignal.value,
			(value) => {
				if (
					managedEntry !== null &&
					managedOwner !== null &&
					activeOwner(managedEntry) === managedOwner
				) {
					managedEntry.style.textContent = value;
				}
			},
			{ flush: "sync", immediate: true },
		);
		const owner = activeOwner(entry);
		if (owner !== undefined) {
			applyOwner(entry.style, owner);
		}
		isLoaded.value = true;
	};
	const load = () => {
		loadRequested = true;
		loadCurrentDocument();
	};
	const unload = () => {
		loadRequested = false;
		if (!isLoaded.value && managedEntry === null) {
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
