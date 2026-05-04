import { getCurrentScope, onDispose, watch } from "@sigrea/core";
import { defaultWindow, resolveTarget } from "../../shared";
import type {
	MaybeTarget,
	OnElementRemovalCallback,
	OnElementRemovalDocumentLike,
	OnElementRemovalOptions,
	OnElementRemovalReturn,
	OnElementRemovalWindowLike,
} from "../types";

function getMutationObserver(
	windowTarget: OnElementRemovalWindowLike | undefined,
	allowGlobalFallback: boolean,
): typeof MutationObserver | undefined {
	return (
		windowTarget?.MutationObserver ??
		(allowGlobalFallback ? globalThis.MutationObserver : undefined)
	);
}

function containsRemovedTarget(removedNode: Node, target: Element): boolean {
	return removedNode === target || removedNode.contains(target);
}

function hasRemovedTarget(
	target: Element,
	mutationRecords: MutationRecord[],
): boolean {
	return mutationRecords.some((mutationRecord) =>
		Array.from(mutationRecord.removedNodes).some((removedNode) =>
			containsRemovedTarget(removedNode, target),
		),
	);
}

export function onElementRemoval<
	TWindow extends OnElementRemovalWindowLike = OnElementRemovalWindowLike,
	TDocument extends OnElementRemovalDocumentLike = OnElementRemovalDocumentLike,
>(
	target: MaybeTarget<Element>,
	callback: OnElementRemovalCallback,
	options: OnElementRemovalOptions<TWindow, TDocument> = {},
): OnElementRemovalReturn {
	const { flush = "sync" } = options;
	const useDefaultWindow =
		!("window" in options) || options.window === undefined;
	const windowTarget = useDefaultWindow
		? (defaultWindow as MaybeTarget<TWindow> | undefined)
		: options.window;
	const documentTarget =
		"document" in options && options.document !== undefined
			? options.document
			: undefined;
	let stopped = false;

	const currentWindow = () =>
		windowTarget === undefined
			? undefined
			: resolveTarget<TWindow>(windowTarget);
	const currentDocument = (windowValue: TWindow | undefined) =>
		documentTarget === undefined
			? windowValue?.document
			: resolveTarget(documentTarget);

	const stopWatch = watch(
		() => {
			const windowValue = currentWindow();

			return {
				document: currentDocument(windowValue),
				element: resolveTarget(target),
				window: windowValue,
			};
		},
		({ document, element, window }, _previousValue, onCleanup) => {
			if (stopped || !document || !element || !window) {
				return;
			}

			const MutationObserverCtor = getMutationObserver(
				window,
				useDefaultWindow,
			);
			if (typeof MutationObserverCtor !== "function") {
				return;
			}

			const observer = new MutationObserverCtor((mutationRecords) => {
				if (stopped || !hasRemovedTarget(element, mutationRecords)) {
					return;
				}

				callback(mutationRecords);
			});

			observer.observe(document, {
				childList: true,
				subtree: true,
			});

			onCleanup(() => {
				observer.disconnect();
			});
		},
		{ immediate: true, flush },
	);

	const stop = () => {
		if (stopped) {
			return;
		}

		stopped = true;
		stopWatch();
	};

	const scope = getCurrentScope();
	if (scope !== undefined) {
		onDispose(stop, scope);
	}

	return stop;
}
