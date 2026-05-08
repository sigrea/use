import { signal } from "@sigrea/core";
import { describe, expect, it, vi } from "vitest";

import { useMagicKeys } from "./index";

function dispatchKeyboardEvent(
	target: EventTarget,
	type: "keydown" | "keyup",
	init: KeyboardEventInit,
): void {
	target.dispatchEvent(new KeyboardEvent(type, init));
}

describe("useMagicKeys", () => {
	it("tracks single key state by key and code", () => {
		const target = document.createElement("input");
		const keys = useMagicKeys({ target });

		expect(keys.a.value).toBe(false);
		expect(keys.keya.value).toBe(false);

		dispatchKeyboardEvent(target, "keydown", { code: "KeyA", key: "A" });

		expect(keys.a.value).toBe(true);
		expect(keys.keya.value).toBe(true);
		expect(keys.current.value.has("a")).toBe(true);

		dispatchKeyboardEvent(target, "keyup", { code: "KeyA", key: "A" });

		expect(keys.a.value).toBe(false);
		expect(keys.keya.value).toBe(false);
		expect(keys.current.value.has("a")).toBe(false);
	});

	it("tracks key combinations with aliases", () => {
		const target = document.createElement("input");
		const keys = useMagicKeys({ target });
		const combo = keys.Ctrl_Shift_Period;

		expect(combo.value).toBe(false);

		dispatchKeyboardEvent(target, "keydown", {
			ctrlKey: true,
			key: "Control",
		});
		dispatchKeyboardEvent(target, "keydown", {
			ctrlKey: true,
			key: "Shift",
			shiftKey: true,
		});
		dispatchKeyboardEvent(target, "keydown", {
			code: "Period",
			ctrlKey: true,
			key: ".",
			shiftKey: true,
		});

		expect(combo.value).toBe(true);
	});

	it("keeps empty combination parts false", () => {
		const target = document.createElement("input");
		const keys = useMagicKeys({ target });

		expect(keys["-"].value).toBe(false);
		expect(keys.Ctrl_.value).toBe(false);
		expect(keys["Ctrl_-A"].value).toBe(false);

		dispatchKeyboardEvent(target, "keydown", {
			ctrlKey: true,
			key: "Control",
		});
		dispatchKeyboardEvent(target, "keydown", {
			ctrlKey: true,
			key: "a",
		});

		expect(keys["-"].value).toBe(false);
		expect(keys.Ctrl_.value).toBe(false);
		expect(keys["Ctrl_-A"].value).toBe(false);
	});

	it("clears keys pressed after shift is released", () => {
		const target = document.createElement("input");
		const keys = useMagicKeys({ target });

		dispatchKeyboardEvent(target, "keydown", { key: "v" });
		dispatchKeyboardEvent(target, "keydown", { key: "u" });
		dispatchKeyboardEvent(target, "keydown", { key: "Shift", shiftKey: true });
		dispatchKeyboardEvent(target, "keydown", { key: "e", shiftKey: true });

		expect(keys.v.value).toBe(true);
		expect(keys.u.value).toBe(true);
		expect(keys.shift.value).toBe(true);
		expect(keys.e.value).toBe(true);

		dispatchKeyboardEvent(target, "keyup", { key: "Shift", shiftKey: true });

		expect(keys.v.value).toBe(true);
		expect(keys.u.value).toBe(true);
		expect(keys.shift.value).toBe(false);
		expect(keys.e.value).toBe(false);
	});

	it("clears meta dependent keys when meta is released", () => {
		const target = document.createElement("input");
		const keys = useMagicKeys({ target });

		dispatchKeyboardEvent(target, "keydown", { key: "a" });
		dispatchKeyboardEvent(target, "keydown", { key: "Meta", metaKey: true });

		expect(keys.a.value).toBe(true);
		expect(keys.command.value).toBe(true);

		dispatchKeyboardEvent(target, "keyup", { key: "Meta", metaKey: true });

		expect(keys.command.value).toBe(false);
		expect(keys.a.value).toBe(false);
	});

	it("supports a custom alias map", () => {
		const target = document.createElement("input");
		const keys = useMagicKeys({ aliasMap: { ct: "control" }, target });

		expect(keys.ct.value).toBe(false);

		dispatchKeyboardEvent(target, "keydown", {
			ctrlKey: true,
			key: "Control",
		});

		expect(keys.ct.value).toBe(true);
	});

	it("returns booleans in reactive mode", () => {
		const target = document.createElement("input");
		const keys = useMagicKeys({ reactive: true, target });

		expect(keys.a).toBe(false);

		dispatchKeyboardEvent(target, "keydown", { key: "a" });

		expect(keys.a).toBe(true);
		expect(keys.current.has("a")).toBe(true);
	});

	it("resets pressed keys on window blur and focus", () => {
		const target = document.createElement("input");
		const windowTarget = new EventTarget();
		const keys = useMagicKeys({ target, window: windowTarget });

		dispatchKeyboardEvent(target, "keydown", { altKey: true, key: "Alt" });
		dispatchKeyboardEvent(target, "keydown", { altKey: true, key: "Tab" });

		expect(keys.alt_tab.value).toBe(true);

		windowTarget.dispatchEvent(new Event("blur"));

		expect(keys.alt_tab.value).toBe(false);

		dispatchKeyboardEvent(target, "keydown", { altKey: true, key: "Alt" });
		dispatchKeyboardEvent(target, "keydown", { altKey: true, key: "Tab" });

		expect(keys.alt_tab.value).toBe(true);

		windowTarget.dispatchEvent(new Event("focus"));

		expect(keys.alt_tab.value).toBe(false);
	});

	it("resets pressed keys when a reactive target changes", () => {
		const firstTarget = document.createElement("input");
		const secondTarget = document.createElement("input");
		const target = signal<EventTarget | null>(firstTarget);
		const keys = useMagicKeys({ target });

		dispatchKeyboardEvent(firstTarget, "keydown", { code: "KeyA", key: "A" });

		expect(keys.a.value).toBe(true);
		expect(keys.keya.value).toBe(true);
		expect(keys.current.value.has("a")).toBe(true);

		target.value = secondTarget;

		expect(keys.a.value).toBe(false);
		expect(keys.keya.value).toBe(false);
		expect(keys.current.value.size).toBe(0);

		dispatchKeyboardEvent(firstTarget, "keyup", { code: "KeyA", key: "A" });
		dispatchKeyboardEvent(secondTarget, "keydown", { code: "KeyB", key: "B" });

		expect(keys.a.value).toBe(false);
		expect(keys.b.value).toBe(true);
		expect(keys.current.value.has("b")).toBe(true);

		keys.stop();
	});

	it("calls the custom event handler after key state is updated", () => {
		const target = document.createElement("input");
		const onEventFired = vi.fn();
		const keys = useMagicKeys({ onEventFired, passive: false, target });

		dispatchKeyboardEvent(target, "keydown", { key: "a" });

		expect(keys.a.value).toBe(true);
		expect(onEventFired).toHaveBeenCalledOnce();
		expect(onEventFired.mock.calls[0]?.[0]).toBeInstanceOf(KeyboardEvent);
	});

	it("ignores empty and undefined keys", () => {
		const target = document.createElement("input");
		const keys = useMagicKeys({ target });
		const event = new KeyboardEvent("keyup", {});
		Object.defineProperty(event, "key", { value: undefined });

		expect(() =>
			target.dispatchEvent(new KeyboardEvent("keyup", {})),
		).not.toThrow();
		expect(() =>
			target.dispatchEvent(new KeyboardEvent("keyup", { key: "" })),
		).not.toThrow();
		expect(() => target.dispatchEvent(event)).not.toThrow();
		expect(keys.a.value).toBe(false);
	});

	it("does not attach default listeners when window is null", () => {
		const keys = useMagicKeys({ window: null });

		window.dispatchEvent(new KeyboardEvent("keydown", { key: "a" }));

		expect(keys.a.value).toBe(false);
	});

	it("stops key and reset listeners", () => {
		const target = document.createElement("input");
		const windowTarget = new EventTarget();
		const keys = useMagicKeys({ target, window: windowTarget });

		keys.stop();
		dispatchKeyboardEvent(target, "keydown", { key: "a" });
		windowTarget.dispatchEvent(new Event("blur"));

		expect(keys.a.value).toBe(false);
	});
});
