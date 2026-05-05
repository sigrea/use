import { disposeTrackedMolecules, signal } from "@sigrea/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { FocusWithinElementLike } from "../types";
import { useFocusWithin } from "./index";

function dispatchFocus(
	target: EventTarget,
	type: "focusin" | "focusout",
	relatedTarget: EventTarget | null = null,
) {
	target.dispatchEvent(new FocusEvent(type, { bubbles: true, relatedTarget }));
}

describe("useFocusWithin", () => {
	afterEach(() => {
		document.body.innerHTML = "";
		vi.restoreAllMocks();
		disposeTrackedMolecules();
	});

	it("tracks focus inside the target", () => {
		const target = document.createElement("form");
		const input = document.createElement("input");
		target.append(input);
		const focusWithin = useFocusWithin(target);

		expect(focusWithin.focused.value).toBe(false);

		dispatchFocus(input, "focusin");
		expect(focusWithin.focused.value).toBe(true);

		dispatchFocus(input, "focusout");
		expect(focusWithin.focused.value).toBe(false);

		focusWithin.stop();
	});

	it("keeps focus when focus moves inside the target", () => {
		const target = document.createElement("form");
		const firstInput = document.createElement("input");
		const secondInput = document.createElement("input");
		target.append(firstInput, secondInput);
		const focusWithin = useFocusWithin(target);

		dispatchFocus(firstInput, "focusin");
		expect(focusWithin.focused.value).toBe(true);

		dispatchFocus(firstInput, "focusout", secondInput);
		expect(focusWithin.focused.value).toBe(true);

		dispatchFocus(secondInput, "focusout", document.body);
		expect(focusWithin.focused.value).toBe(false);

		focusWithin.stop();
	});

	it("clears focus when related focus moves outside the target", () => {
		const target = document.createElement("form");
		const input = document.createElement("input");
		const outside = document.createElement("button");
		vi.spyOn(target, "matches").mockImplementation((selector) => {
			return selector === ":focus-within";
		});
		target.append(input);
		document.body.append(target, outside);
		const focusWithin = useFocusWithin(target);

		dispatchFocus(input, "focusin");
		expect(focusWithin.focused.value).toBe(true);

		dispatchFocus(input, "focusout", outside);
		expect(focusWithin.focused.value).toBe(false);

		focusWithin.stop();
	});

	it("keeps focus when the target still matches focus within", () => {
		const target = document.createElement("form");
		const input = document.createElement("input");
		let hasFocusWithin = false;
		vi.spyOn(target, "matches").mockImplementation((selector) => {
			return selector === ":focus-within" && hasFocusWithin;
		});
		target.append(input);
		const focusWithin = useFocusWithin(target);

		dispatchFocus(input, "focusin");
		expect(focusWithin.focused.value).toBe(true);

		hasFocusWithin = true;
		dispatchFocus(input, "focusout");
		expect(focusWithin.focused.value).toBe(true);

		hasFocusWithin = false;
		dispatchFocus(input, "focusout");
		expect(focusWithin.focused.value).toBe(false);

		focusWithin.stop();
	});

	it("retargets listeners and clears stale focus state", () => {
		const firstTarget = document.createElement("form");
		const firstInput = document.createElement("input");
		const secondTarget = document.createElement("form");
		const secondInput = document.createElement("input");
		firstTarget.append(firstInput);
		secondTarget.append(secondInput);
		const target = signal<FocusWithinElementLike | null>(firstTarget);
		const focusWithin = useFocusWithin(target);

		dispatchFocus(firstInput, "focusin");
		expect(focusWithin.focused.value).toBe(true);

		target.value = secondTarget;
		expect(focusWithin.focused.value).toBe(false);

		dispatchFocus(firstInput, "focusin");
		expect(focusWithin.focused.value).toBe(false);

		dispatchFocus(secondInput, "focusin");
		expect(focusWithin.focused.value).toBe(true);

		target.value = null;
		expect(focusWithin.focused.value).toBe(false);

		dispatchFocus(secondInput, "focusin");
		expect(focusWithin.focused.value).toBe(false);

		focusWithin.stop();
	});

	it("stops listeners and resets the focused state", () => {
		const target = document.createElement("form");
		const input = document.createElement("input");
		target.append(input);
		const focusWithin = useFocusWithin(target);

		dispatchFocus(input, "focusin");
		expect(focusWithin.focused.value).toBe(true);

		focusWithin.stop();
		focusWithin.stop();
		expect(focusWithin.focused.value).toBe(false);

		dispatchFocus(input, "focusin");
		expect(focusWithin.focused.value).toBe(false);
	});

	it("treats missing and failing matches as not focused within", () => {
		const target = document.createElement("form");
		const input = document.createElement("input");
		vi.spyOn(target, "matches").mockImplementation(() => {
			throw new Error("unsupported selector");
		});
		target.append(input);
		const focusWithin = useFocusWithin(target);

		dispatchFocus(input, "focusin");
		expect(focusWithin.focused.value).toBe(true);

		dispatchFocus(input, "focusout");
		expect(focusWithin.focused.value).toBe(false);

		focusWithin.stop();
	});
});
