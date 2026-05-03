import { readonly, signal, watch } from "@sigrea/core";
import { defaultDocument, listen, resolveTarget } from "../../shared";
import type {
	DocumentVisibilityDocumentLike,
	MaybeTarget,
	UseDocumentVisibilityOptions,
	UseDocumentVisibilityReturn,
} from "../types";

function readVisibility<TDocument extends DocumentVisibilityDocumentLike>(
	document: TDocument | null | undefined,
): DocumentVisibilityState {
	return document?.visibilityState ?? "visible";
}

export function useDocumentVisibility<
	TDocument extends
		DocumentVisibilityDocumentLike = DocumentVisibilityDocumentLike,
>(
	options: UseDocumentVisibilityOptions<TDocument> = {},
): UseDocumentVisibilityReturn {
	const documentTarget =
		"document" in options && options.document !== undefined
			? options.document
			: (defaultDocument as MaybeTarget<TDocument> | undefined);
	const initialDocument =
		documentTarget === undefined
			? undefined
			: resolveTarget<TDocument>(documentTarget);
	const visibility = signal(readVisibility(initialDocument));
	const stop = watch(
		() =>
			documentTarget === undefined
				? undefined
				: resolveTarget<TDocument>(documentTarget),
		(nextDocument, _previousDocument, onCleanup) => {
			visibility.value = readVisibility(nextDocument);

			if (nextDocument === undefined || nextDocument === null) {
				return;
			}

			const syncVisibility = () => {
				visibility.value = readVisibility(nextDocument);
			};

			onCleanup(
				listen(nextDocument, "visibilitychange", syncVisibility, {
					passive: true,
				}),
			);
		},
		{ immediate: true, flush: "sync" },
	);

	return {
		stop,
		visibility: readonly(visibility),
	};
}
