import { disposeTrackedMolecules, signal } from "@sigrea/core";
import { afterEach, describe, expect, it } from "vitest";

import type { UseWindowFocusDocumentLike } from "../types";
import { useWindowFocus } from "./index";

class FakeDocument extends EventTarget implements UseWindowFocusDocumentLike {
	constructor(private currentFocus: boolean) {
		super();
	}

	hasFocus(): boolean {
		return this.currentFocus;
	}

	setFocus(value: boolean): void {
		this.currentFocus = value;
	}
}

class FakeWindow extends EventTarget {
	readonly navigator = navigator;

	constructor(readonly document: FakeDocument) {
		super();
	}

	focusWindow(): void {
		this.document.setFocus(true);
		this.dispatchEvent(new Event("focus"));
	}

	blurWindow(): void {
		this.document.setFocus(false);
		this.dispatchEvent(new Event("blur"));
	}
}

describe("useWindowFocus", () => {
	afterEach(() => {
		disposeTrackedMolecules();
	});

	it("reads the initial document focus state", () => {
		const focus = useWindowFocus({
			window: new FakeWindow(new FakeDocument(true)),
		});

		expect(focus.focused.value).toBe(true);
	});

	it("tracks focus and blur events", () => {
		const fakeWindow = new FakeWindow(new FakeDocument(true));
		const focus = useWindowFocus({
			window: fakeWindow,
		});

		fakeWindow.blurWindow();
		expect(focus.focused.value).toBe(false);

		fakeWindow.focusWindow();
		expect(focus.focused.value).toBe(true);
	});

	it("retargets listeners when the window changes", () => {
		const firstWindow = new FakeWindow(new FakeDocument(true));
		const secondWindow = new FakeWindow(new FakeDocument(false));
		const currentWindow = signal<FakeWindow | null>(firstWindow);
		const focus = useWindowFocus({
			window: currentWindow,
		});

		expect(focus.focused.value).toBe(true);

		currentWindow.value = secondWindow;
		expect(focus.focused.value).toBe(false);

		firstWindow.blurWindow();
		expect(focus.focused.value).toBe(false);

		secondWindow.focusWindow();
		expect(focus.focused.value).toBe(true);
	});

	it("falls back to false when the window is unavailable", () => {
		const currentWindow = signal<FakeWindow | null>(
			new FakeWindow(new FakeDocument(true)),
		);
		const focus = useWindowFocus({
			window: currentWindow,
		});

		expect(focus.focused.value).toBe(true);

		currentWindow.value = null;
		expect(focus.focused.value).toBe(false);
	});

	it("respects an explicitly unavailable window", () => {
		const focus = useWindowFocus({
			window: null,
		});

		expect(focus.focused.value).toBe(false);

		focus.stop();
	});

	it("falls back to false when document focus cannot be read", () => {
		const windowWithoutDocument = new EventTarget();
		const windowWithoutHasFocus = Object.assign(new EventTarget(), {
			document: new EventTarget(),
		});

		const missingDocumentFocus = useWindowFocus({
			window: windowWithoutDocument,
		});
		const missingHasFocus = useWindowFocus({
			window: windowWithoutHasFocus,
		});

		expect(missingDocumentFocus.focused.value).toBe(false);
		expect(missingHasFocus.focused.value).toBe(false);

		missingDocumentFocus.stop();
		missingHasFocus.stop();
	});

	it("stops listening to window events", () => {
		const fakeWindow = new FakeWindow(new FakeDocument(true));
		const focus = useWindowFocus({
			window: fakeWindow,
		});

		focus.stop();
		fakeWindow.blurWindow();

		expect(focus.focused.value).toBe(true);
	});
});
