import { computed, signal, watch } from "@sigrea/core";

import { defaultDocument, resolveTarget, resolveValue } from "../../shared";
import { tryOnScopeDispose } from "../tryOnScopeDispose";
import type {
	MaybeTarget,
	MaybeValue,
	UseMutationObserverWindowLike,
	UseTitleDocumentLike,
	UseTitleOptions,
	UseTitleReturn,
	UseTitleTemplate,
} from "../types";
import { useMutationObserver } from "../useMutationObserver";

function queryTitleElement(
	document: UseTitleDocumentLike | undefined,
): HTMLTitleElement | undefined {
	return document?.head?.querySelector("title") ?? undefined;
}

function formatWithTemplate(
	template: string | undefined,
	title: string,
): string {
	return (template || "%s").replace(/%s/g, title);
}

function formatTitle(
	title: string,
	template: UseTitleTemplate | undefined,
): string {
	if (template === undefined) {
		return title;
	}

	if (typeof template === "function") {
		return template(title);
	}

	return formatWithTemplate(
		resolveValue(template as MaybeValue<string>),
		title,
	);
}

/**
 * Reactive document title controls.
 */
export function useTitle<
	TDocument extends UseTitleDocumentLike = UseTitleDocumentLike,
>(
	...args: [
		newTitle?: MaybeValue<string | null | undefined>,
		options?: UseTitleOptions<TDocument>,
	]
): UseTitleReturn {
	const [newTitle, options = {}] = args;
	const hasTitleSource = args.length >= 1 && newTitle != null;
	const useDefaultDocument =
		!("document" in options) || options.document === undefined;
	const documentTarget = useDefaultDocument
		? (defaultDocument as MaybeTarget<TDocument | null | undefined> | undefined)
		: options.document;
	const title = signal<string | null | undefined>(
		hasTitleSource
			? resolveValue(newTitle)
			: (currentDocument()?.title ?? null),
	);
	const originalTitles = new Map<TDocument, string>();
	let stopped = false;

	function currentDocument(): TDocument | undefined {
		return documentTarget === undefined
			? undefined
			: resolveTarget<TDocument | null | undefined>(documentTarget);
	}

	function currentTemplate(): UseTitleTemplate | undefined {
		return "titleTemplate" in options ? options.titleTemplate : undefined;
	}

	function shouldObserve(): boolean {
		return (
			!("titleTemplate" in options) &&
			"observe" in options &&
			options.observe === true
		);
	}

	function rememberOriginal(document: TDocument): void {
		if (!originalTitles.has(document)) {
			originalTitles.set(document, document.title);
		}
	}

	function restoreDocument(document: TDocument): void {
		const originalTitle = originalTitles.get(document);
		if (originalTitle === undefined) {
			return;
		}

		originalTitles.delete(document);

		if (options.restoreOnUnmount === false) {
			return;
		}

		const restoredTitle =
			typeof options.restoreOnUnmount === "function"
				? options.restoreOnUnmount(originalTitle, title.value ?? "")
				: originalTitle;
		if (restoredTitle != null) {
			document.title = restoredTitle;
		}
	}

	function writeTitle(
		document: TDocument | undefined,
		formattedTitle: string,
	): void {
		if (stopped || document === undefined) {
			return;
		}

		rememberOriginal(document);
		if (document.title !== formattedTitle) {
			document.title = formattedTitle;
		}
	}

	const stopSourceWatch = hasTitleSource
		? watch(
				() => resolveValue(newTitle),
				(nextTitle) => {
					title.value = nextTitle;
				},
				{ immediate: true, flush: "sync" },
			)
		: () => {};
	const stopApplyWatch = watch(
		() => {
			const document = currentDocument();
			const rawTitle = title.value;

			return {
				document,
				formattedTitle: formatTitle(rawTitle ?? "", currentTemplate()),
			};
		},
		(nextValue, previousValue) => {
			if (
				previousValue?.document !== undefined &&
				previousValue.document !== nextValue.document
			) {
				restoreDocument(previousValue.document);
			}

			writeTitle(nextValue.document, nextValue.formattedTitle);
		},
		{ immediate: true, flush: "sync" },
	);
	const mutationObserver = useMutationObserver(
		() => {
			if (!shouldObserve()) {
				return undefined;
			}

			return queryTitleElement(currentDocument());
		},
		() => {
			const document = currentDocument();
			if (stopped || document === undefined) {
				return;
			}

			const formattedTitle = formatTitle(title.value ?? "", currentTemplate());
			if (document.title !== formattedTitle) {
				title.value = document.title;
			}
		},
		{
			childList: true,
			window: () =>
				(currentDocument()?.defaultView as
					| UseMutationObserverWindowLike
					| null
					| undefined) ?? null,
		},
	);

	const titleValue = computed<string | null | undefined>({
		get: () => title.value,
		set(nextTitle) {
			title.value = nextTitle;
			writeTitle(
				currentDocument(),
				formatTitle(nextTitle ?? "", currentTemplate()),
			);
		},
	}) as UseTitleReturn;
	Object.defineProperty(titleValue, "stop", {
		configurable: true,
		enumerable: false,
		value: () => {
			if (stopped) {
				return;
			}

			stopped = true;
			stopSourceWatch();
			stopApplyWatch();
			mutationObserver.stop();
			for (const document of [...originalTitles.keys()]) {
				restoreDocument(document);
			}
		},
	});

	tryOnScopeDispose(titleValue.stop);

	return titleValue;
}
