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
	const windowTarget =
		"window" in options && options.window !== undefined
			? options.window
			: (defaultWindow as MaybeTarget<TWindow> | undefined);
	const resolveCurrentWindow = () =>
		windowTarget === undefined
			? undefined
			: resolveTarget<TWindow>(windowTarget);
	const resolveCurrentDocument = (currentWindow: TWindow | undefined) => {
		if ("document" in options && options.document !== undefined) {
			return resolveTarget<TDocument>(options.document);
		}

		return currentWindow?.document as TDocument | null | undefined;
	};
	const initialWindow = resolveCurrentWindow();
	const initialDocument = resolveCurrentDocument(initialWindow);
	const activeElement = signal<TElement | null | undefined>(
		readActiveElement(initialDocument, deep) as TElement | null | undefined,
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
		() => {
			const currentWindow = resolveCurrentWindow();

			return {
				document: resolveCurrentDocument(currentWindow),
				window: currentWindow,
			};
		},
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
						document,
						window: window as unknown as OnElementRemovalWindowLike,
					},
				);

				cleanups.push(stopRemoval);
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
