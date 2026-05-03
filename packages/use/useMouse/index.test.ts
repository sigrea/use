import { disposeTrackedMolecules, signal } from "@sigrea/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useMouse } from "./index";

class FakeWindow extends EventTarget {
	document = document;
	navigator = navigator;
	scrollX = 0;
	scrollY = 0;

	setScroll(x: number, y: number) {
		this.scrollX = x;
		this.scrollY = y;
		this.dispatchEvent(new Event("scroll"));
	}
}

function mouseEvent(
	type: string,
	values: Partial<
		Pick<
			MouseEvent,
			| "pageX"
			| "pageY"
			| "clientX"
			| "clientY"
			| "screenX"
			| "screenY"
			| "movementX"
			| "movementY"
		>
	>,
): MouseEvent {
	const event = new MouseEvent(type, {
		clientX: values.clientX,
		clientY: values.clientY,
		screenX: values.screenX,
		screenY: values.screenY,
	});
	Object.defineProperties(event, {
		pageX: { value: values.pageX ?? values.clientX ?? 0 },
		pageY: { value: values.pageY ?? values.clientY ?? 0 },
		movementX: { value: values.movementX ?? 0 },
		movementY: { value: values.movementY ?? 0 },
	});

	return event;
}

function touchEvent(type: string, x: number, y: number): TouchEvent {
	const event = new Event(type) as TouchEvent;
	Object.defineProperty(event, "touches", {
		value: [
			{
				pageX: x,
				pageY: y,
				clientX: x + 1,
				clientY: y + 1,
				screenX: x + 2,
				screenY: y + 2,
			},
		],
	});

	return event;
}

describe("useMouse", () => {
	afterEach(() => {
		disposeTrackedMolecules();
	});

	it.each([
		["page", { pageX: 10, pageY: 20 }, [10, 20]],
		["client", { clientX: 30, clientY: 40 }, [30, 40]],
		["screen", { screenX: 50, screenY: 60 }, [50, 60]],
		["movement", { movementX: 7, movementY: 8 }, [7, 8]],
	] as const)("tracks %s mouse coordinates", (type, values, expected) => {
		const target = new EventTarget();
		const mouse = useMouse({ target, type, touch: false });

		target.dispatchEvent(mouseEvent("mousemove", values));

		expect(mouse.x.value).toBe(expected[0]);
		expect(mouse.y.value).toBe(expected[1]);
		expect(mouse.sourceType.value).toBe("mouse");

		mouse.stop();
	});

	it("listens to dragover and stops updates after stop", () => {
		const target = new EventTarget();
		const mouse = useMouse({ target, touch: false });

		target.dispatchEvent(mouseEvent("dragover", { pageX: 11, pageY: 12 }));
		expect(mouse.x.value).toBe(11);
		expect(mouse.y.value).toBe(12);

		mouse.stop();
		target.dispatchEvent(mouseEvent("mousemove", { pageX: 20, pageY: 21 }));
		expect(mouse.x.value).toBe(11);
		expect(mouse.y.value).toBe(12);
	});

	it("tracks touch movement and can reset on touchend", () => {
		const target = new EventTarget();
		const mouse = useMouse({
			target,
			initialValue: { x: 1, y: 2 },
			resetOnTouchEnds: true,
		});

		target.dispatchEvent(touchEvent("touchstart", 20, 30));
		expect(mouse.x.value).toBe(20);
		expect(mouse.y.value).toBe(30);
		expect(mouse.sourceType.value).toBe("touch");

		target.dispatchEvent(new Event("touchend"));
		expect(mouse.x.value).toBe(1);
		expect(mouse.y.value).toBe(2);

		mouse.stop();
	});

	it("does not listen to touch events when touch is disabled", () => {
		const target = new EventTarget();
		const mouse = useMouse({ target, touch: false });

		target.dispatchEvent(touchEvent("touchmove", 20, 30));

		expect(mouse.x.value).toBe(0);
		expect(mouse.y.value).toBe(0);

		mouse.stop();
	});

	it("adjusts page coordinates when the window scrolls", () => {
		const fakeWindow = new FakeWindow();
		const target = new EventTarget();
		const mouse = useMouse({ target, window: fakeWindow });

		target.dispatchEvent(mouseEvent("mousemove", { pageX: 100, pageY: 200 }));
		fakeWindow.setScroll(5, 7);

		expect(mouse.x.value).toBe(105);
		expect(mouse.y.value).toBe(207);

		mouse.stop();
	});

	it("does not fall back to the default window when window is null", () => {
		const addSpy = vi.spyOn(window, "addEventListener");
		const mouse = useMouse({ window: null });

		expect(addSpy).not.toHaveBeenCalled();

		window.dispatchEvent(mouseEvent("mousemove", { pageX: 20, pageY: 30 }));
		expect(mouse.x.value).toBe(0);
		expect(mouse.y.value).toBe(0);

		mouse.stop();
		addSpy.mockRestore();
	});

	it("does not fall back to the default window when target is null", () => {
		const addSpy = vi.spyOn(window, "addEventListener");
		const mouse = useMouse({ target: null });

		expect(addSpy).not.toHaveBeenCalled();

		window.dispatchEvent(mouseEvent("mousemove", { pageX: 20, pageY: 30 }));
		expect(mouse.x.value).toBe(0);
		expect(mouse.y.value).toBe(0);

		mouse.stop();
		addSpy.mockRestore();
	});

	it("retargets mouse listeners when target changes", () => {
		const firstTarget = new EventTarget();
		const secondTarget = new EventTarget();
		const target = signal<EventTarget | null>(firstTarget);
		const mouse = useMouse({ target, touch: false });

		firstTarget.dispatchEvent(
			mouseEvent("mousemove", { pageX: 10, pageY: 20 }),
		);
		expect(mouse.x.value).toBe(10);
		expect(mouse.y.value).toBe(20);

		target.value = secondTarget;
		firstTarget.dispatchEvent(
			mouseEvent("mousemove", { pageX: 30, pageY: 40 }),
		);
		expect(mouse.x.value).toBe(10);
		expect(mouse.y.value).toBe(20);

		secondTarget.dispatchEvent(
			mouseEvent("mousemove", { pageX: 50, pageY: 60 }),
		);
		expect(mouse.x.value).toBe(50);
		expect(mouse.y.value).toBe(60);

		mouse.stop();
	});
});
