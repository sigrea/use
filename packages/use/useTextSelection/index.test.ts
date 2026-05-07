import { disposeTrackedMolecules, signal } from "@sigrea/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import type {
	UseTextSelectionDocumentLike,
	UseTextSelectionWindowLike,
} from "../types";
import { useTextSelection } from "./index";

interface SelectionState {
	text: string;
	ranges: Range[];
	anchorNode?: Node | null;
	focusNode?: Node | null;
}

function createRect(values: Partial<DOMRect> = {}): DOMRect {
	return {
		bottom: 0,
		height: 0,
		left: 0,
		right: 0,
		toJSON: () => ({}),
		top: 0,
		width: 0,
		x: 0,
		y: 0,
		...values,
	} as DOMRect;
}

function createRange(rect: DOMRect): Range {
	return {
		getBoundingClientRect: vi.fn(() => rect),
	} as unknown as Range;
}

function createSelection(state: SelectionState): Selection {
	return {
		get anchorNode() {
			return state.anchorNode ?? null;
		},
		get focusNode() {
			return state.focusNode ?? null;
		},
		get rangeCount() {
			return state.ranges.length;
		},
		getRangeAt(index: number) {
			const range = state.ranges[index];
			if (range === undefined) {
				throw new Error(`Range ${index} does not exist`);
			}

			return range;
		},
		toString: () => state.text,
	} as Selection;
}

class FakeSelectionDocument
	extends EventTarget
	implements UseTextSelectionDocumentLike {}

class FakeSelectionWindow
	extends EventTarget
	implements UseTextSelectionWindowLike
{
	readonly document = new FakeSelectionDocument();

	constructor(private selectionValue: Selection | null) {
		super();
	}

	getSelection(): Selection | null {
		return this.selectionValue;
	}

	setSelection(selection: Selection | null): void {
		this.selectionValue = selection;
	}

	dispatchSelectionChange(): void {
		this.document.dispatchEvent(new Event("selectionchange"));
	}
}

describe("useTextSelection", () => {
	afterEach(() => {
		disposeTrackedMolecules();
		vi.restoreAllMocks();
	});

	it("uses empty state when selection is null", () => {
		const window = new FakeSelectionWindow(null);
		const result = useTextSelection({ window });

		expect(result.selection.value).toBeNull();
		expect(result.text.value).toBe("");
		expect(result.ranges.value).toEqual([]);
		expect(result.rects.value).toEqual([]);

		result.stop();
	});

	it("reads an existing selection", () => {
		const firstRect = createRect({ height: 10, width: 20 });
		const secondRect = createRect({ height: 30, width: 40 });
		const firstRange = createRange(firstRect);
		const secondRange = createRange(secondRect);
		const anchor = document.createTextNode("Hello");
		const state: SelectionState = {
			anchorNode: anchor,
			focusNode: anchor,
			ranges: [firstRange, secondRange],
			text: "Hello World",
		};
		const selection = createSelection(state);
		const window = new FakeSelectionWindow(selection);
		const result = useTextSelection({ window });

		expect(result.selection.value).toBe(selection);
		expect(result.text.value).toBe("Hello World");
		expect(result.ranges.value).toEqual([firstRange, secondRange]);
		expect(result.rects.value).toEqual([firstRect, secondRect]);
		expect(result.selection.value?.anchorNode).toBe(anchor);
		expect(result.selection.value?.focusNode).toBe(anchor);

		result.stop();
	});

	it("updates when the document emits selectionchange", () => {
		const addSpy = vi.spyOn(
			FakeSelectionDocument.prototype,
			"addEventListener",
		);
		const nextRect = createRect({ left: 12, top: 4 });
		const nextRange = createRange(nextRect);
		const state: SelectionState = {
			ranges: [],
			text: "",
		};
		const selection = createSelection(state);
		const window = new FakeSelectionWindow(selection);
		const result = useTextSelection({ window });

		expect(addSpy).toHaveBeenCalledWith(
			"selectionchange",
			expect.any(Function),
			{ passive: true },
		);
		expect(result.text.value).toBe("");

		state.text = "Selected";
		state.ranges = [nextRange];
		window.dispatchSelectionChange();

		expect(result.selection.value).toBe(selection);
		expect(result.text.value).toBe("Selected");
		expect(result.ranges.value).toEqual([nextRange]);
		expect(result.rects.value).toEqual([nextRect]);

		result.stop();
	});

	it("updates when getSelection returns a different selection object", () => {
		const initialSelection = createSelection({ ranges: [], text: "" });
		const nextRange = createRange(createRect({ width: 8 }));
		const nextSelection = createSelection({
			ranges: [nextRange],
			text: "Next",
		});
		const window = new FakeSelectionWindow(initialSelection);
		const result = useTextSelection({ window });

		window.setSelection(nextSelection);
		window.dispatchSelectionChange();

		expect(result.selection.value).toBe(nextSelection);
		expect(result.text.value).toBe("Next");
		expect(result.ranges.value).toEqual([nextRange]);

		result.stop();
	});

	it("retargets listeners when the window changes", () => {
		const firstSelection = createSelection({
			ranges: [],
			text: "First",
		});
		const secondState: SelectionState = {
			ranges: [],
			text: "Second",
		};
		const secondSelection = createSelection(secondState);
		const firstWindow = new FakeSelectionWindow(firstSelection);
		const secondWindow = new FakeSelectionWindow(secondSelection);
		const window = signal<UseTextSelectionWindowLike | null>(firstWindow);
		const result = useTextSelection({ window });

		expect(result.text.value).toBe("First");

		window.value = secondWindow;
		expect(result.text.value).toBe("Second");

		firstWindow.setSelection(
			createSelection({
				ranges: [],
				text: "Old",
			}),
		);
		firstWindow.dispatchSelectionChange();
		expect(result.text.value).toBe("Second");

		secondState.text = "Updated";
		secondWindow.dispatchSelectionChange();
		expect(result.text.value).toBe("Updated");

		result.stop();
	});

	it("stops listening to selection changes", () => {
		const state: SelectionState = {
			ranges: [],
			text: "Initial",
		};
		const window = new FakeSelectionWindow(createSelection(state));
		const result = useTextSelection({ window });

		result.stop();
		state.text = "Changed";
		window.dispatchSelectionChange();

		expect(result.text.value).toBe("Initial");

		result.stop();
	});

	it("does not fall back to the default window when window is null", () => {
		const result = useTextSelection({ window: null });

		expect(result.selection.value).toBeNull();
		expect(result.text.value).toBe("");
		expect(result.ranges.value).toEqual([]);
		expect(result.rects.value).toEqual([]);

		result.stop();
	});
});
