import { disposeTrackedMolecules, signal } from "@sigrea/core";
import { afterEach, describe, expect, it } from "vitest";

import type { FocusMethodOptions, FocusableElementLike } from "../types";
import { useFocus } from "./index";

class FakeFocusableElement extends EventTarget implements FocusableElementLike {
	isFocusVisible = true;
	lastFocusOptions: FocusMethodOptions | undefined;

	focus(options?: FocusMethodOptions) {
		this.lastFocusOptions = options;
		this.dispatchEvent(new Event("focus"));
	}

	blur() {
		this.dispatchEvent(new Event("blur"));
	}

	matches(selector: string) {
		return selector === ":focus-visible" && this.isFocusVisible;
	}
}

describe("useFocus", () => {
	afterEach(() => {
		disposeTrackedMolecules();
	});

	it("tracks focus and blur events", () => {
		const target = new FakeFocusableElement();
		const focus = useFocus(target);

		target.focus();
		expect(focus.focused.value).toBe(true);

		target.blur();
		expect(focus.focused.value).toBe(false);

		focus.stop();
	});

	it("focuses and blurs the target through writable focused", () => {
		const target = new FakeFocusableElement();
		const focus = useFocus(target, {
			focusVisible: true,
			preventScroll: true,
		});

		focus.focused.value = true;
		expect(focus.focused.value).toBe(true);
		expect(target.lastFocusOptions).toEqual({
			preventScroll: true,
		});
		expect(target.lastFocusOptions).not.toHaveProperty("focusVisible");

		focus.focused.value = false;
		expect(focus.focused.value).toBe(false);

		focus.stop();
	});

	it("exposes focus and blur methods", () => {
		const target = new FakeFocusableElement();
		const focus = useFocus(target);

		focus.focus();
		expect(focus.focused.value).toBe(true);

		focus.blur();
		expect(focus.focused.value).toBe(false);

		focus.stop();
	});

	it("focuses the target when initialValue is true", () => {
		const target = new FakeFocusableElement();
		const focus = useFocus(target, { initialValue: true });

		expect(focus.focused.value).toBe(true);

		focus.stop();
	});

	it("can require focus-visible matches", () => {
		const target = new FakeFocusableElement();
		target.isFocusVisible = false;
		const focus = useFocus(target, { focusVisible: true });

		target.focus();
		expect(focus.focused.value).toBe(false);

		target.isFocusVisible = true;
		target.focus();
		expect(focus.focused.value).toBe(true);

		focus.stop();
	});

	it("retargets focus listeners when the target changes", () => {
		const firstTarget = new FakeFocusableElement();
		const secondTarget = new FakeFocusableElement();
		const target = signal<FocusableElementLike | null>(firstTarget);
		const focus = useFocus(target);

		firstTarget.focus();
		expect(focus.focused.value).toBe(true);

		target.value = secondTarget;
		expect(focus.focused.value).toBe(false);

		firstTarget.focus();
		expect(focus.focused.value).toBe(false);

		secondTarget.focus();
		expect(focus.focused.value).toBe(true);

		focus.stop();
	});
});
