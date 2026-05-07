import { computed, readonly, signal, watch } from "@sigrea/core";

import { defaultWindow, listen, resolveTarget } from "../../shared";
import { tryOnScopeDispose } from "../tryOnScopeDispose";
import type {
	MaybeTarget,
	UseTextSelectionOptions,
	UseTextSelectionReturn,
	UseTextSelectionWindowLike,
} from "../types";

function readSelection(
	window: UseTextSelectionWindowLike | null | undefined,
): Selection | null {
	return typeof window?.getSelection === "function"
		? (window.getSelection() ?? null)
		: null;
}

function getRangesFromSelection(selection: Selection | null): Range[] {
	if (selection === null) {
		return [];
	}

	return Array.from({ length: selection.rangeCount }, (_, index) =>
		selection.getRangeAt(index),
	);
}

function getRectsFromRanges(ranges: readonly Range[]): DOMRect[] {
	return ranges.map((range) => range.getBoundingClientRect());
}

export function useTextSelection<
	TWindow extends UseTextSelectionWindowLike = UseTextSelectionWindowLike,
>(options: UseTextSelectionOptions<TWindow> = {}): UseTextSelectionReturn {
	const windowTarget =
		"window" in options && options.window !== undefined
			? options.window
			: (defaultWindow as MaybeTarget<TWindow | null | undefined> | undefined);
	const currentWindow = () =>
		windowTarget === undefined
			? undefined
			: resolveTarget<TWindow | null | undefined>(windowTarget);
	const initialSelection = readSelection(currentWindow());
	const initialRanges = getRangesFromSelection(initialSelection);
	const selection = signal<Selection | null>(initialSelection);
	const textSnapshot = signal(initialSelection?.toString() ?? "");
	const rangesSnapshot = signal<Range[]>(initialRanges);
	const rectsSnapshot = signal<DOMRect[]>(getRectsFromRanges(initialRanges));
	const ranges = computed(() => rangesSnapshot.value);
	const text = computed(() => textSnapshot.value);
	const rects = computed(() => rectsSnapshot.value);

	const syncSelection = (
		window: UseTextSelectionWindowLike | null | undefined,
	): void => {
		const nextSelection = readSelection(window);
		const nextRanges = getRangesFromSelection(nextSelection);

		selection.value = null;
		selection.value = nextSelection;
		textSnapshot.value = nextSelection?.toString() ?? "";
		rangesSnapshot.value = nextRanges;
		rectsSnapshot.value = getRectsFromRanges(nextRanges);
	};

	const stop = watch(
		() => currentWindow(),
		(nextWindow, _previousWindow, onCleanup) => {
			syncSelection(nextWindow);

			if (nextWindow?.document === undefined) {
				return;
			}

			onCleanup(
				listen(
					nextWindow.document,
					"selectionchange",
					() => {
						syncSelection(nextWindow);
					},
					{ passive: true },
				),
			);
		},
		{ immediate: true, flush: "sync" },
	);

	const stopSelection = () => {
		stop();
	};
	tryOnScopeDispose(stopSelection);

	return {
		ranges,
		rects,
		selection: readonly(selection),
		stop: stopSelection,
		text,
	};
}
