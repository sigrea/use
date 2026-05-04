import { signal } from "@sigrea/core";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { KeyStrokeEventName } from "../types";
import { onKeyDown, onKeyPressed, onKeyStroke, onKeyUp } from "./index";

describe("onKeyStroke", () => {
	let element: HTMLElement;
	let callback: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		element = document.createElement("div");
		callback = vi.fn();
	});

	function dispatchKey(
		key: string,
		type: KeyStrokeEventName = "keydown",
		repeat = false,
	) {
		const event = new KeyboardEvent(type, { key, repeat });
		element.dispatchEvent(event);
		return event;
	}

	it("listens to a single key", () => {
		const stop = onKeyStroke("A", callback, { target: element });

		dispatchKey("A");
		dispatchKey("B");

		expect(callback).toHaveBeenCalledTimes(1);
		stop();
	});

	it("listens to multiple keys", () => {
		const stop = onKeyStroke(["A", "B", "C"], callback, { target: element });

		dispatchKey("A");
		dispatchKey("B");
		dispatchKey("C");
		dispatchKey("D");

		expect(callback).toHaveBeenCalledTimes(3);
		stop();
	});

	it("accepts a predicate filter", () => {
		const stop = onKeyStroke((event) => event.key === "A", callback, {
			target: element,
		});

		dispatchKey("A");
		dispatchKey("B");
		dispatchKey("C");

		expect(callback).toHaveBeenCalledTimes(1);
		stop();
	});

	it("listens to all keys by boolean filter", () => {
		const stop = onKeyStroke(true, callback, { target: element });

		dispatchKey("A");
		dispatchKey("B");
		dispatchKey("C");

		expect(callback).toHaveBeenCalledTimes(3);
		stop();
	});

	it("listens to all keys with the handler-only overload", () => {
		const stop = onKeyStroke(callback, { target: element });

		dispatchKey("A");
		dispatchKey("B");

		expect(callback).toHaveBeenCalledTimes(2);
		stop();
	});

	it("uses keydown on window when target is omitted", () => {
		const stop = onKeyStroke("A", callback);

		window.dispatchEvent(new KeyboardEvent("keydown", { key: "A" }));
		window.dispatchEvent(new KeyboardEvent("keyup", { key: "A" }));

		expect(callback).toHaveBeenCalledTimes(1);
		stop();
	});

	it("listens to the configured event name", () => {
		const stop = onKeyStroke("A", callback, {
			eventName: "keypress",
			target: element,
		});

		dispatchKey("A", "keydown");
		dispatchKey("A", "keypress");
		dispatchKey("B", "keypress");

		expect(callback).toHaveBeenCalledTimes(1);
		stop();
	});

	it("ignores repeated events when dedupe is enabled", () => {
		const stop = onKeyStroke("A", callback, { dedupe: true, target: element });

		dispatchKey("A", "keydown", false);
		dispatchKey("A", "keydown", true);
		dispatchKey("A", "keydown", true);

		expect(callback).toHaveBeenCalledTimes(1);
		stop();
	});

	it("resolves reactive dedupe values when events fire", () => {
		const dedupe = signal(true);
		const stop = onKeyStroke("A", callback, { dedupe, target: element });

		dispatchKey("A", "keydown", true);
		expect(callback).not.toHaveBeenCalled();

		dedupe.value = false;
		dispatchKey("A", "keydown", true);

		expect(callback).toHaveBeenCalledTimes(1);
		stop();
	});

	it("does not listen while the explicit target is null", () => {
		const target = signal<HTMLElement | null>(element);
		const stop = onKeyStroke("A", callback, { target });

		dispatchKey("A");
		expect(callback).toHaveBeenCalledTimes(1);

		target.value = null;
		dispatchKey("A");
		expect(callback).toHaveBeenCalledTimes(1);

		stop();
	});

	it("returns a stop function", () => {
		const stop = onKeyStroke("A", callback, { target: element });

		dispatchKey("A");
		stop();
		dispatchKey("A");

		expect(callback).toHaveBeenCalledTimes(1);
	});

	it("uses passive listener options when requested", () => {
		const addEventListener = vi.spyOn(element, "addEventListener");
		const stop = onKeyStroke("A", callback, { passive: true, target: element });

		expect(addEventListener).toHaveBeenCalledWith(
			"keydown",
			expect.any(Function),
			{ passive: true },
		);

		stop();
	});

	it("provides key event aliases", () => {
		const keyDown = vi.fn();
		const keyPressed = vi.fn();
		const keyUp = vi.fn();
		const stopDown = onKeyDown("A", keyDown, { target: element });
		const stopPressed = onKeyPressed("A", keyPressed, { target: element });
		const stopUp = onKeyUp("A", keyUp, { target: element });

		dispatchKey("A", "keydown");
		dispatchKey("A", "keypress");
		dispatchKey("A", "keyup");

		expect(keyDown).toHaveBeenCalledTimes(1);
		expect(keyPressed).toHaveBeenCalledTimes(1);
		expect(keyUp).toHaveBeenCalledTimes(1);

		stopDown();
		stopPressed();
		stopUp();
	});
});
