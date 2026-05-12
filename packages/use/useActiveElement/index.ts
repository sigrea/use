import { readonly, signal, watch } from "@sigrea/core";
import { defaultWindow, listen, resolveTarget } from "../../shared";
import { onElementRemoval } from "../onElementRemoval";
import type {
	MaybeTarget,
	OnElementRemovalWindowLike,
	UseActiveElementDocumentLike,
	UseActiveElementOptions,
	UseActiveElementReturn,
	UseActiveElementWindowLike,
} from "../types";

function readActiveElement(
	document: UseActiveElementDocumentLike | null | undefined,
	deep: boolean,
): Element | null | undefined {
	let element = document?.activeElement;

	if (!deep) {
		return element;
	}

	while (element?.shadowRoot) {
		element = element.shadowRoot.activeElement;
	}

	return element;
}

function resolveDocumentWindow<TWindow extends UseActiveElementWindowLike>(
	document: UseActiveElementDocumentLike | null | undefined,
): TWindow | undefined {
	const documentWithView = document as
		| (UseActiveElementDocumentLike & {
				readonly defaultView?: TWindow | null;
				readonly ownerDocument?: {
					readonly defaultView?: TWindow | null;
				} | null;
		  })
		| null
		| undefined;

	return (
		documentWithView?.defaultView ??
		documentWithView?.ownerDocument?.defaultView ??
		undefined
	);
}

function resolveElementRoot(
	element: Element | null | undefined,
	fallback: UseActiveElementDocumentLike | null | undefined,
): UseActiveElementDocumentLike | null | undefined {
	return (
		(element?.getRootNode?.() as UseActiveElementDocumentLike | undefined) ??
		fallback
	);
}

function resolveElementRootHost(
	element: Element | null | undefined,
): Element | undefined {
	const root = element?.getRootNode?.() as
		| { readonly host?: Element }
		| undefined;
	return root?.host;
}

function resolveElementRootOwner(
	element: Element | null | undefined,
	fallback: UseActiveElementDocumentLike | null | undefined,
): UseActiveElementDocumentLike | null | undefined {
	const root = element?.getRootNode?.() as
		| {
				readonly host?: Element;
				readonly ownerDocument?: UseActiveElementDocumentLike | null;
		  }
		| undefined;

	return root?.host?.ownerDocument ?? root?.ownerDocument ?? fallback;
}

/**
 * Reactive active element for a document or shadow root.
 *
 * @param options Active element tracking options.
 */
export function useActiveElement<
	TElement extends Element = Element,
	TWindow extends UseActiveElementWindowLike = UseActiveElementWindowLike,
	TDocument extends UseActiveElementDocumentLike = UseActiveElementDocumentLike,
>(
	options: UseActiveElementOptions<TWindow, TDocument> = {},
): UseActiveElementReturn<TElement> {
	const { deep = true, triggerOnRemoval = false } = options;
	const hasWindowOption = "window" in options && options.window !== undefined;
	const hasDocumentOption =
		"document" in options && options.document !== undefined;
	const windowTarget = hasWindowOption ? options.window : undefined;
	const documentTarget = hasDocumentOption ? options.document : undefined;
	const resolveWindowOption = () =>
		windowTarget === undefined
			? undefined
			: resolveTarget<TWindow>(windowTarget);
	const resolveDocumentOption = () =>
		documentTarget === undefined
			? undefined
			: resolveTarget<TDocument>(documentTarget);
	const resolveCurrentTargets = () => {
		const windowOption = resolveWindowOption();
		const document = hasDocumentOption
			? resolveDocumentOption()
			: hasWindowOption
				? (windowOption?.document as TDocument | null | undefined)
				: (defaultWindow?.document as TDocument | null | undefined);
		const window = hasWindowOption
			? windowOption
			: hasDocumentOption
				? resolveDocumentWindow<TWindow>(document)
				: (defaultWindow as TWindow | undefined);

		return { document, window };
	};
	const initialTargets = resolveCurrentTargets();
	const activeElement = signal<TElement | null | undefined>(
		readActiveElement(initialTargets.document, deep) as
			| TElement
			| null
			| undefined,
	);

	const syncActiveElement = (
		document: UseActiveElementDocumentLike | null | undefined,
	) => {
		activeElement.value = readActiveElement(document, deep) as
			| TElement
			| null
			| undefined;
	};

	const stop = watch(
		resolveCurrentTargets,
		({ document, window }, _previousValue, onCleanup) => {
			syncActiveElement(document);
			const cleanups: Array<() => void> = [];

			if (window !== undefined && window !== null) {
				const listenerOptions = {
					capture: true,
					passive: true,
				};
				const syncCurrentActiveElement = () => {
					syncActiveElement(document);
				};
				cleanups.push(
					listen(
						window,
						"blur",
						(event) => {
							if ((event as FocusEvent).relatedTarget !== null) {
								return;
							}

							syncCurrentActiveElement();
						},
						listenerOptions,
					),
					listen(window, "focus", syncCurrentActiveElement, listenerOptions),
				);
			}

			if (
				triggerOnRemoval &&
				document !== undefined &&
				document !== null &&
				window !== undefined &&
				window !== null
			) {
				const stopRemoval = onElementRemoval(
					() => activeElement.value ?? undefined,
					() => {
						syncActiveElement(document);
					},
					{
						document: () => resolveElementRoot(activeElement.value, document),
						window: window as unknown as OnElementRemovalWindowLike,
					},
				);

				cleanups.push(stopRemoval);

				const stopRootHostRemoval = onElementRemoval(
					() => resolveElementRootHost(activeElement.value),
					() => {
						syncActiveElement(document);
					},
					{
						document: () =>
							resolveElementRootOwner(activeElement.value, document),
						window: window as unknown as OnElementRemovalWindowLike,
					},
				);

				cleanups.push(stopRootHostRemoval);
			}

			if (cleanups.length > 0) {
				onCleanup(() => {
					for (const cleanup of cleanups) {
						cleanup();
					}
				});
			}
		},
		{ immediate: true, flush: "sync" },
	);

	return {
		activeElement: readonly(activeElement),
		stop,
	};
}
