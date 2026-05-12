import { disposeTrackedMolecules, signal } from "@sigrea/core";
import { afterEach, describe, expect, it } from "vitest";

import type { DocumentLike, WindowLike } from "../types";
import { usePageLeave } from "./index";

class FakeDocument extends EventTarget implements DocumentLike {
	defaultView: WindowLike | null = null;
}

class FakeWindow extends EventTarget implements WindowLike {
	readonly document = new FakeDocument();

	constructor() {
		super();
		this.document.defaultView = this;
	}
}

function dispatchMouse(
	target: EventTarget,
	type: string,
	relatedTarget: EventTarget | null = null,
) {
	target.dispatchEvent(new MouseEvent(type, { relatedTarget }));
}

function dispatchLegacyMouse(
	target: EventTarget,
	type: string,
	toElement: EventTarget | null,
) {
	const event = new MouseEvent(type);
	Object.defineProperty(event, "toElement", {
		value: toElement,
	});
	target.dispatchEvent(event);
}

describe("usePageLeave", () => {
	afterEach(() => {
		disposeTrackedMolecules();
	});

	it("starts with the pointer inside the page", () => {
		const pageLeave = usePageLeave({
			window: new FakeWindow(),
		});

		expect(pageLeave.isLeft.value).toBe(false);

		pageLeave.stop();
	});

	it("tracks page leave and enter events", () => {
		const fakeWindow = new FakeWindow();
		const pageLeave = usePageLeave({
			window: fakeWindow,
		});

		dispatchMouse(fakeWindow, "mouseout", fakeWindow.document);
		expect(pageLeave.isLeft.value).toBe(false);

		dispatchMouse(fakeWindow, "mouseout");
		expect(pageLeave.isLeft.value).toBe(true);

		dispatchMouse(fakeWindow.document, "mouseenter");
		expect(pageLeave.isLeft.value).toBe(false);

		dispatchMouse(fakeWindow.document, "mouseleave");
		expect(pageLeave.isLeft.value).toBe(true);

		pageLeave.stop();
	});

	it("falls back to legacy toElement", () => {
		const fakeWindow = new FakeWindow();
		const pageLeave = usePageLeave({
			window: fakeWindow,
		});

		dispatchLegacyMouse(fakeWindow, "mouseout", fakeWindow.document);
		expect(pageLeave.isLeft.value).toBe(false);

		dispatchLegacyMouse(fakeWindow, "mouseout", null);
		expect(pageLeave.isLeft.value).toBe(true);

		pageLeave.stop();
	});

	it("retargets listeners when the window changes", () => {
		const firstWindow = new FakeWindow();
		const secondWindow = new FakeWindow();
		const windowTarget = signal<WindowLike | null>(firstWindow);
		const pageLeave = usePageLeave({
			window: windowTarget,
		});

		dispatchMouse(firstWindow, "mouseout");
		expect(pageLeave.isLeft.value).toBe(true);

		windowTarget.value = secondWindow;
		expect(pageLeave.isLeft.value).toBe(false);

		dispatchMouse(firstWindow, "mouseout");
		expect(pageLeave.isLeft.value).toBe(false);

		dispatchMouse(secondWindow, "mouseout");
		expect(pageLeave.isLeft.value).toBe(true);

		pageLeave.stop();
	});

	it("resets when the window becomes unavailable", () => {
		const fakeWindow = new FakeWindow();
		const windowTarget = signal<WindowLike | null>(fakeWindow);
		const pageLeave = usePageLeave({
			window: windowTarget,
		});

		dispatchMouse(fakeWindow, "mouseout");
		expect(pageLeave.isLeft.value).toBe(true);

		windowTarget.value = null;
		expect(pageLeave.isLeft.value).toBe(false);

		dispatchMouse(fakeWindow, "mouseout");
		expect(pageLeave.isLeft.value).toBe(false);

		pageLeave.stop();
	});

	it("stops listening to page events", () => {
		const fakeWindow = new FakeWindow();
		const pageLeave = usePageLeave({
			window: fakeWindow,
		});

		pageLeave.stop();
		dispatchMouse(fakeWindow, "mouseout");

		expect(pageLeave.isLeft.value).toBe(false);
	});

	it("is safe without a window", () => {
		const pageLeave = usePageLeave({
			window: null,
		});

		expect(pageLeave.isLeft.value).toBe(false);

		pageLeave.stop();
	});
});
