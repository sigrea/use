import { computed, signal, watch } from "@sigrea/core";

import { defaultDocument, resolveTarget, resolveValue } from "../../shared";
import type {
	MaybeTarget,
	MaybeValue,
	UseFaviconDocumentLike,
	UseFaviconOptions,
	UseFaviconReturn,
} from "../types";

interface LinkSnapshot {
	href: string | null;
	media: string | null;
	sizes: string | null;
	type: string | null;
}

function hasRel(link: HTMLLinkElement, rel: string): boolean {
	const targetRel = rel.toLowerCase();
	return link.rel
		.split(/\s+/)
		.some((candidate) => candidate.toLowerCase() === targetRel);
}

function findIconLinks(
	document: UseFaviconDocumentLike | undefined,
	rel: string,
	media: string | undefined,
): HTMLLinkElement[] {
	const links = document?.head?.querySelectorAll("link[rel]");
	if (links === undefined) {
		return [];
	}

	return Array.from(links).filter((link): link is HTMLLinkElement => {
		const candidate = link as HTMLLinkElement;
		if (!hasRel(candidate, rel)) {
			return false;
		}

		return media === undefined || candidate.getAttribute("media") === media;
	});
}

function readFirstIcon(
	document: UseFaviconDocumentLike | undefined,
	rel: string,
	media: string | undefined,
): string | null {
	return findIconLinks(document, rel, media)[0]?.getAttribute("href") ?? null;
}

function readSnapshot(link: HTMLLinkElement): LinkSnapshot {
	return {
		href: link.getAttribute("href"),
		media: link.getAttribute("media"),
		sizes: link.getAttribute("sizes"),
		type: link.getAttribute("type"),
	};
}

function restoreAttribute(
	link: HTMLLinkElement,
	name: keyof LinkSnapshot,
	value: string | null,
) {
	if (value === null) {
		link.removeAttribute(name);
		return;
	}

	link.setAttribute(name, value);
}

function restoreSnapshot(link: HTMLLinkElement, snapshot: LinkSnapshot): void {
	restoreAttribute(link, "href", snapshot.href);
	restoreAttribute(link, "media", snapshot.media);
	restoreAttribute(link, "sizes", snapshot.sizes);
	restoreAttribute(link, "type", snapshot.type);
}

/**
 * Reactive favicon controls.
 */
export function useFavicon(
	icon?: MaybeValue<string | null | undefined>,
	options?: UseFaviconOptions,
): UseFaviconReturn;
export function useFavicon<
	TDocument extends UseFaviconDocumentLike = UseFaviconDocumentLike,
>(
	...args: [
		icon?: MaybeValue<string | null | undefined>,
		options?: UseFaviconOptions<TDocument>,
	]
): UseFaviconReturn {
	const [icon, options] = args;
	const { baseUrl = "", media, rel = "icon", sizes, type } = options ?? {};
	const documentTarget =
		options !== undefined &&
		"document" in options &&
		options.document !== undefined
			? options.document
			: (defaultDocument as MaybeTarget<TDocument> | undefined);
	const hasIconSource = args.length >= 1 && icon !== undefined;
	const currentDocument = () =>
		documentTarget === undefined
			? undefined
			: resolveTarget<TDocument>(documentTarget);
	const favicon = signal<string | null | undefined>(
		hasIconSource
			? resolveValue(icon)
			: readFirstIcon(currentDocument(), rel, media),
	);
	const originalLinks = new Map<HTMLLinkElement, LinkSnapshot>();
	const createdLinks = new Set<HTMLLinkElement>();
	let stopped = false;
	let skipInitialDocumentApply = !hasIconSource;

	const rememberLink = (link: HTMLLinkElement) => {
		if (!originalLinks.has(link) && !createdLinks.has(link)) {
			originalLinks.set(link, readSnapshot(link));
		}
	};
	const clearManagedLinks = () => {
		for (const link of createdLinks) {
			link.remove();
		}
		createdLinks.clear();

		for (const [link, snapshot] of originalLinks) {
			restoreSnapshot(link, snapshot);
		}
		originalLinks.clear();
	};
	const createLink = (document: UseFaviconDocumentLike): HTMLLinkElement => {
		const link = document.createElement("link");
		link.rel = rel;
		document.head?.appendChild(link);
		createdLinks.add(link);

		return link;
	};
	const clearDocumentLinks = (document: UseFaviconDocumentLike | undefined) => {
		for (const link of [...createdLinks]) {
			if (link.ownerDocument === document) {
				link.remove();
				createdLinks.delete(link);
			}
		}

		for (const [link, snapshot] of [...originalLinks]) {
			if (link.ownerDocument === document) {
				restoreSnapshot(link, snapshot);
				originalLinks.delete(link);
			}
		}
	};
	const applyIcon = (
		document: UseFaviconDocumentLike | undefined,
		nextIcon: string | null | undefined,
	) => {
		if (stopped || document?.head === undefined) {
			return;
		}

		if (typeof nextIcon !== "string") {
			clearManagedLinks();
			return;
		}

		const links = findIconLinks(document, rel, media);
		const targets = links.length > 0 ? links : [createLink(document)];
		const href = `${baseUrl}${nextIcon}`;

		for (const link of targets) {
			rememberLink(link);
			link.setAttribute("href", href);
			if (media !== undefined) {
				link.media = media;
			}
			if (sizes !== undefined) {
				link.setAttribute("sizes", sizes);
			}
			if (type !== undefined) {
				link.type = type;
			}
		}
	};

	const stopSourceWatch = hasIconSource
		? watch(
				() => resolveValue(icon),
				(nextIcon) => {
					favicon.value = nextIcon;
				},
				{ immediate: true, flush: "sync" },
			)
		: () => {};
	const stopApplyWatch = watch(
		() => ({
			document: currentDocument(),
			icon: favicon.value,
		}),
		({ document, icon: nextIcon }, previousValue) => {
			if (previousValue === undefined && skipInitialDocumentApply) {
				skipInitialDocumentApply = false;
				return;
			}

			if (previousValue !== undefined && previousValue.document !== document) {
				clearDocumentLinks(previousValue.document);
			}
			applyIcon(document, nextIcon);
		},
		{ immediate: true, flush: "sync" },
	);
	const value = computed<string | null | undefined>({
		get: () => favicon.value,
		set(nextIcon) {
			favicon.value = nextIcon;
			applyIcon(currentDocument(), nextIcon);
		},
	}) as UseFaviconReturn;
	Object.defineProperty(value, "stop", {
		configurable: true,
		enumerable: false,
		value: () => {
			if (stopped) {
				return;
			}

			stopped = true;
			stopSourceWatch();
			stopApplyWatch();
		},
	});

	return value;
}
