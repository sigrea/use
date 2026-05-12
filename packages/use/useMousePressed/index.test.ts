import { disposeTrackedMolecules, signal } from "@sigrea/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useMousePressed } from "./index";

class FakeWindow extends EventTarget {
	document = document;
	navigator = navigator;
}

function expectState(
	state: ReturnType<typeof useMousePressed>,
	expected: { pressed: boolean; sourceType: "mouse" | "touch" | null },
) {
	expect(state.pressed.value).toBe(expected.pressed);
	expect(state.sourceType.value).toBe(expected.sourceType);
}

describe("useMousePressed", () => {
	afterEach(() => {
		document.body.innerHTML = "";
		disposeTrackedMolecules();
	});

	it("uses the default and custom initial value", () => {
		const defaultState = useMousePressed({ window: new FakeWindow() });
		const customState = useMousePressed({
			initialValue: true,
			window: new FakeWindow(),
		});

		expectState(defaultState, { pressed: false, sourceType: null });
		expectState(customState, { pressed: true, sourceType: null });

		defaultState.stop();
		customState.stop();
	});

	it("tracks mouse press and release on the window", () => {
		const fakeWindow = new FakeWindow();
		const state = useMousePressed({ window: fakeWindow });

		fakeWindow.dispatchEvent(new MouseEvent("mousedown"));
		expectState(state, { pressed: true, sourceType: "mouse" });

		fakeWindow.dispatchEvent(new MouseEvent("mouseup"));
		expectState(state, { pressed: false, sourceType: null });

		fakeWindow.dispatchEvent(new MouseEvent("mousedown"));
		expectState(state, { pressed: true, sourceType: "mouse" });

		fakeWindow.dispatchEvent(new MouseEvent("mouseleave"));
		expectState(state, { pressed: false, sourceType: null });

		state.stop();
	});

	it("tracks mouse press on the target and release on the window", () => {
		const fakeWindow = new FakeWindow();
		const target = document.createElement("button");
		const state = useMousePressed({ target, window: fakeWindow });

		fakeWindow.dispatchEvent(new MouseEvent("mousedown"));
		expectState(state, { pressed: false, sourceType: null });

		target.dispatchEvent(new MouseEvent("mousedown"));
		expectState(state, { pressed: true, sourceType: "mouse" });

		fakeWindow.dispatchEvent(new MouseEvent("mouseup"));
		expectState(state, { pressed: false, sourceType: null });

		state.stop();
	});

	it("does not fall back to the window while a reactive target is unresolved", () => {
		const fakeWindow = new FakeWindow();
		const first = document.createElement("button");
		const second = document.createElement("button");
		const target = signal<EventTarget | null>(null);
		const state = useMousePressed({ target, window: fakeWindow });

		fakeWindow.dispatchEvent(new MouseEvent("mousedown"));
		expectState(state, { pressed: false, sourceType: null });

		target.value = first;
		fakeWindow.dispatchEvent(new MouseEvent("mousedown"));
		expectState(state, { pressed: false, sourceType: null });
		first.dispatchEvent(new MouseEvent("mousedown"));
		expectState(state, { pressed: true, sourceType: "mouse" });
		fakeWindow.dispatchEvent(new MouseEvent("mouseup"));

		target.value = second;
		first.dispatchEvent(new MouseEvent("mousedown"));
		expectState(state, { pressed: false, sourceType: null });
		second.dispatchEvent(new MouseEvent("mousedown"));
		expectState(state, { pressed: true, sourceType: "mouse" });

		state.stop();
	});

	it("does not fall back to the default window when target is null", () => {
		const addSpy = vi.spyOn(window, "addEventListener");
		const state = useMousePressed({ target: null });

		expect(addSpy).not.toHaveBeenCalled();
		window.dispatchEvent(new MouseEvent("mousedown"));
		expectState(state, { pressed: false, sourceType: null });

		state.stop();
		addSpy.mockRestore();
	});

	it("runs callbacks with source events", () => {
		const fakeWindow = new FakeWindow();
		const onPressed = vi.fn();
		const onReleased = vi.fn();
		const state = useMousePressed({
			onPressed,
			onReleased,
			window: fakeWindow,
		});
		const down = new MouseEvent("mousedown");
		const up = new MouseEvent("mouseup");

		fakeWindow.dispatchEvent(down);
		fakeWindow.dispatchEvent(up);

		expect(onPressed).toHaveBeenCalledWith(down);
		expect(onReleased).toHaveBeenCalledWith(up);

		state.stop();
	});

	it("tracks drag press and release", () => {
		const fakeWindow = new FakeWindow();
		const state = useMousePressed({ window: fakeWindow });

		fakeWindow.dispatchEvent(new Event("dragstart") as DragEvent);
		expectState(state, { pressed: true, sourceType: "mouse" });
		fakeWindow.dispatchEvent(new Event("drop") as DragEvent);
		expectState(state, { pressed: false, sourceType: null });

		fakeWindow.dispatchEvent(new Event("dragstart") as DragEvent);
		expectState(state, { pressed: true, sourceType: "mouse" });
		fakeWindow.dispatchEvent(new Event("dragend") as DragEvent);
		expectState(state, { pressed: false, sourceType: null });

		state.stop();
	});

	it("can disable drag events", () => {
		const fakeWindow = new FakeWindow();
		const state = useMousePressed({ drag: false, window: fakeWindow });

		fakeWindow.dispatchEvent(new Event("dragstart") as DragEvent);
		expectState(state, { pressed: false, sourceType: null });

		state.stop();
	});

	it("tracks touch press and release", () => {
		const fakeWindow = new FakeWindow();
		const state = useMousePressed({ window: fakeWindow });

		fakeWindow.dispatchEvent(new Event("touchstart") as TouchEvent);
		expectState(state, { pressed: true, sourceType: "touch" });
		fakeWindow.dispatchEvent(new Event("touchend") as TouchEvent);
		expectState(state, { pressed: false, sourceType: null });

		fakeWindow.dispatchEvent(new Event("touchstart") as TouchEvent);
		expectState(state, { pressed: true, sourceType: "touch" });
		fakeWindow.dispatchEvent(new Event("touchcancel") as TouchEvent);
		expectState(state, { pressed: false, sourceType: null });

		state.stop();
	});

	it("can disable touch events", () => {
		const fakeWindow = new FakeWindow();
		const state = useMousePressed({ touch: false, window: fakeWindow });

		fakeWindow.dispatchEvent(new Event("touchstart") as TouchEvent);
		expectState(state, { pressed: false, sourceType: null });

		state.stop();
	});

	it("uses capture listeners when requested", () => {
		const fakeWindow = new FakeWindow();
		const addSpy = vi.spyOn(fakeWindow, "addEventListener");
		const state = useMousePressed({ capture: true, window: fakeWindow });

		expect(addSpy).toHaveBeenCalledWith(
			"mousedown",
			expect.any(Function),
			expect.objectContaining({ capture: true, passive: true }),
		);

		state.stop();
		addSpy.mockRestore();
	});

	it("does not fall back to the default window when window is null", () => {
		const addSpy = vi.spyOn(window, "addEventListener");
		const state = useMousePressed({ window: null });

		expect(addSpy).not.toHaveBeenCalled();
		window.dispatchEvent(new MouseEvent("mousedown"));
		expectState(state, { pressed: false, sourceType: null });

		state.stop();
		addSpy.mockRestore();
	});

	it("clears pressed state when a reactive window changes", () => {
		const firstWindow = new FakeWindow();
		const secondWindow = new FakeWindow();
		const currentWindow = signal<FakeWindow | null>(firstWindow);
		const state = useMousePressed({ window: currentWindow });

		firstWindow.dispatchEvent(new MouseEvent("mousedown"));
		expectState(state, { pressed: true, sourceType: "mouse" });

		currentWindow.value = secondWindow;
		expectState(state, { pressed: false, sourceType: null });

		firstWindow.dispatchEvent(new MouseEvent("mousedown"));
		expectState(state, { pressed: false, sourceType: null });

		secondWindow.dispatchEvent(new MouseEvent("mousedown"));
		expectState(state, { pressed: true, sourceType: "mouse" });

		currentWindow.value = null;
		expectState(state, { pressed: false, sourceType: null });

		secondWindow.dispatchEvent(new MouseEvent("mousedown"));
		expectState(state, { pressed: false, sourceType: null });

		state.stop();
	});

	it("stops listeners and clears pressed state", () => {
		const fakeWindow = new FakeWindow();
		const state = useMousePressed({ window: fakeWindow });

		fakeWindow.dispatchEvent(new MouseEvent("mousedown"));
		expectState(state, { pressed: true, sourceType: "mouse" });

		state.stop();
		expectState(state, { pressed: false, sourceType: null });

		fakeWindow.dispatchEvent(new MouseEvent("mousedown"));
		expectState(state, { pressed: false, sourceType: null });
	});
});
