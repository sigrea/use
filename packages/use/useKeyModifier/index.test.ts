import { disposeTrackedMolecules, signal } from "@sigrea/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { UseKeyModifierDocumentLike, WindowLike } from "../types";
import { useKeyModifier } from "./index";

class FakeKeyModifierDocument
	extends EventTarget
	implements UseKeyModifierDocumentLike
{
	constructor(readonly defaultView: WindowLike | null) {
		super();
	}
}

function dispatchModifierEvent(
	target: EventTarget,
	type: string,
	value: boolean,
): Event & { getModifierState: (keyArg: string) => boolean } {
	const event = new Event(type);
	Object.defineProperty(event, "getModifierState", {
		configurable: true,
		value: vi.fn(() => value),
	});

	target.dispatchEvent(event);

	return event as Event & { getModifierState: (keyArg: string) => boolean };
}

describe("useKeyModifier", () => {
	afterEach(() => {
		disposeTrackedMolecules();
		vi.unstubAllGlobals();
	});

	it("starts with null and tracks modifier state from default events", () => {
		const modifier = useKeyModifier("CapsLock", { document });

		expect(modifier.value).toBeNull();

		const event = dispatchModifierEvent(document, "keydown", true);

		expect(modifier.value).toBe(true);
		expect(event.getModifierState).toHaveBeenCalledWith("CapsLock");

		dispatchModifierEvent(document, "keyup", false);
		expect(modifier.value).toBe(false);

		modifier.stop();
	});

	it("uses the configured initial value", () => {
		const modifier = useKeyModifier("Shift", {
			document,
			initial: false,
		});

		expect(modifier.value).toBe(false);

		dispatchModifierEvent(document, "keydown", true);
		expect(modifier.value).toBe(true);

		modifier.stop();
	});

	it("listens only to configured events", () => {
		const modifier = useKeyModifier("Alt", {
			document,
			events: ["mouseup"],
		});

		dispatchModifierEvent(document, "keydown", true);
		expect(modifier.value).toBeNull();

		dispatchModifierEvent(document, "mouseup", true);
		expect(modifier.value).toBe(true);

		modifier.stop();
	});

	it("ignores events without getModifierState", () => {
		const modifier = useKeyModifier("Meta", { document });

		document.dispatchEvent(new Event("keydown"));

		expect(modifier.value).toBeNull();

		modifier.stop();
	});

	it("resets modifier state when the window blurs", () => {
		const modifier = useKeyModifier("Shift", { document });

		dispatchModifierEvent(document, "keydown", true);
		expect(modifier.value).toBe(true);

		window.dispatchEvent(new Event("blur"));
		expect(modifier.value).toBe(false);

		modifier.stop();
	});

	it("does not fall back to global document when document is null", () => {
		const modifier = useKeyModifier("CapsLock", { document: null });

		dispatchModifierEvent(document, "keydown", true);

		expect(modifier.value).toBeNull();

		modifier.stop();
	});

	it("does not fall back to global blur when document is null", () => {
		const modifier = useKeyModifier("Shift", {
			document: null,
			initial: true,
		});

		window.dispatchEvent(new Event("blur"));

		expect(modifier.value).toBe(true);

		modifier.stop();
	});

	it("moves listeners when the document target changes", () => {
		const first = document.implementation.createHTMLDocument("first");
		const second = document.implementation.createHTMLDocument("second");
		const target = signal<Document | null>(first);
		const modifier = useKeyModifier("NumLock", { document: target });

		dispatchModifierEvent(first, "keydown", true);
		expect(modifier.value).toBe(true);

		target.value = second;
		dispatchModifierEvent(first, "keyup", false);
		expect(modifier.value).toBe(true);

		dispatchModifierEvent(second, "keyup", false);
		expect(modifier.value).toBe(false);

		modifier.stop();
	});

	it("moves blur reset listeners when the document target changes", () => {
		const firstWindow = new EventTarget() as WindowLike;
		const secondWindow = new EventTarget() as WindowLike;
		const first = new FakeKeyModifierDocument(firstWindow);
		const second = new FakeKeyModifierDocument(secondWindow);
		const target = signal<UseKeyModifierDocumentLike | null>(first);
		const modifier = useKeyModifier("Alt", { document: target });

		dispatchModifierEvent(first, "keydown", true);
		expect(modifier.value).toBe(true);

		target.value = second;
		firstWindow.dispatchEvent(new Event("blur"));
		expect(modifier.value).toBe(true);

		secondWindow.dispatchEvent(new Event("blur"));
		expect(modifier.value).toBe(false);

		modifier.stop();
	});

	it("stops listening", () => {
		const modifier = useKeyModifier("ScrollLock", { document });

		dispatchModifierEvent(document, "keydown", true);
		expect(modifier.value).toBe(true);

		modifier.stop();
		dispatchModifierEvent(document, "keyup", false);

		expect(modifier.value).toBe(true);
	});

	it("stops the blur reset listener", () => {
		const windowTarget = new EventTarget() as WindowLike;
		const documentTarget = new FakeKeyModifierDocument(windowTarget);
		const modifier = useKeyModifier("Shift", { document: documentTarget });

		dispatchModifierEvent(documentTarget, "keydown", true);
		expect(modifier.value).toBe(true);

		modifier.stop();
		windowTarget.dispatchEvent(new Event("blur"));

		expect(modifier.value).toBe(true);
	});
});
