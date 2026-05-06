import { disposeTrackedMolecules, signal } from "@sigrea/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useKeyModifier } from "./index";

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

	it("does not fall back to global document when document is null", () => {
		const modifier = useKeyModifier("CapsLock", { document: null });

		dispatchModifierEvent(document, "keydown", true);

		expect(modifier.value).toBeNull();

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

	it("stops listening", () => {
		const modifier = useKeyModifier("ScrollLock", { document });

		dispatchModifierEvent(document, "keydown", true);
		expect(modifier.value).toBe(true);

		modifier.stop();
		dispatchModifierEvent(document, "keyup", false);

		expect(modifier.value).toBe(true);
	});
});
