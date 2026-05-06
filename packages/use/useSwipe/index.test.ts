import { disposeTrackedMolecules, signal } from "@sigrea/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useSwipe } from "./index";

interface TouchPoint {
	clientX: number;
	clientY: number;
}

function touchEvent(
	type: string,
	touches: readonly TouchPoint[],
	options: EventInit = {},
): TouchEvent {
	const event = new Event(type, {
		bubbles: true,
		cancelable: true,
		...options,
	}) as TouchEvent;
	const touchList = touches.map((touch, index) => ({
		clientX: touch.clientX,
		clientY: touch.clientY,
		identifier: index,
		target: null,
	}));

	Object.defineProperties(event, {
		changedTouches: { value: touchList },
		targetTouches: { value: touchList },
		touches: { value: touchList },
	});

	return event;
}

function touchStart(x: number, y: number): TouchEvent {
	return touchEvent("touchstart", [{ clientX: x, clientY: y }]);
}

function touchMove(x: number, y: number, options: EventInit = {}): TouchEvent {
	return touchEvent("touchmove", [{ clientX: x, clientY: y }], options);
}

function touchEnd(): TouchEvent {
	return touchEvent("touchend", []);
}

describe("useSwipe", () => {
	let element: HTMLDivElement;

	beforeEach(() => {
		element = document.createElement("div");
		document.body.append(element);
	});

	afterEach(() => {
		document.body.innerHTML = "";
		disposeTrackedMolecules();
		vi.restoreAllMocks();
	});

	it("uses initial state and ignores null targets", () => {
		const addSpy = vi.spyOn(window, "addEventListener");
		const swipe = useSwipe(null);

		expect(addSpy).not.toHaveBeenCalled();
		expect(swipe.isSwiping.value).toBe(false);
		expect(swipe.direction.value).toBe("none");
		expect(swipe.coordsStart.value).toEqual({ x: 0, y: 0 });
		expect(swipe.coordsEnd.value).toEqual({ x: 0, y: 0 });
		expect(swipe.lengthX.value).toBe(0);
		expect(swipe.lengthY.value).toBe(0);

		window.dispatchEvent(touchStart(10, 20));
		expect(swipe.coordsStart.value).toEqual({ x: 0, y: 0 });

		swipe.stop();
	});

	it("tracks a swipe and ends on touchend", () => {
		const onSwipeStart = vi.fn();
		const onSwipe = vi.fn();
		const onSwipeEnd = vi.fn();
		const swipe = useSwipe(element, {
			onSwipe,
			onSwipeEnd,
			onSwipeStart,
			threshold: 20,
		});
		const start = touchStart(100, 50);
		const move = touchMove(70, 55);
		const end = touchEnd();

		element.dispatchEvent(start);
		expect(onSwipeStart).toHaveBeenCalledWith(start);
		expect(swipe.coordsStart.value).toEqual({ x: 100, y: 50 });
		expect(swipe.coordsEnd.value).toEqual({ x: 100, y: 50 });
		expect(swipe.isSwiping.value).toBe(false);

		element.dispatchEvent(move);
		expect(swipe.coordsEnd.value).toEqual({ x: 70, y: 55 });
		expect(swipe.lengthX.value).toBe(30);
		expect(swipe.lengthY.value).toBe(-5);
		expect(swipe.direction.value).toBe("left");
		expect(swipe.isSwiping.value).toBe(true);
		expect(onSwipe).toHaveBeenCalledWith(move);

		element.dispatchEvent(end);
		expect(swipe.isSwiping.value).toBe(false);
		expect(swipe.direction.value).toBe("left");
		expect(onSwipeEnd).toHaveBeenCalledWith(end, "left");

		swipe.stop();
	});

	it("keeps direction as none until the threshold is reached", () => {
		const onSwipe = vi.fn();
		const onSwipeEnd = vi.fn();
		const swipe = useSwipe(element, { onSwipe, onSwipeEnd, threshold: 30 });

		element.dispatchEvent(touchStart(0, 0));
		element.dispatchEvent(touchMove(29, 0));
		element.dispatchEvent(touchEnd());

		expect(swipe.direction.value).toBe("none");
		expect(swipe.isSwiping.value).toBe(false);
		expect(onSwipe).not.toHaveBeenCalled();
		expect(onSwipeEnd).not.toHaveBeenCalled();

		swipe.stop();
	});

	it.each([
		["up", [0, 60], [0, 30]],
		["down", [0, 0], [0, 30]],
		["left", [60, 0], [30, 0]],
		["right", [0, 0], [30, 0]],
	] as const)("detects %s direction", (expected, start, move) => {
		const onSwipeEnd = vi.fn();
		const swipe = useSwipe(element, { onSwipeEnd, threshold: 30 });

		element.dispatchEvent(touchStart(start[0], start[1]));
		element.dispatchEvent(touchMove(move[0], move[1]));
		element.dispatchEvent(touchEnd());

		expect(swipe.direction.value).toBe(expected);
		expect(onSwipeEnd).toHaveBeenCalledWith(expect.any(Event), expected);

		swipe.stop();
	});

	it("uses a reactive threshold", () => {
		const threshold = signal(50);
		const swipe = useSwipe(element, { threshold });

		element.dispatchEvent(touchStart(0, 0));
		element.dispatchEvent(touchMove(30, 0));
		expect(swipe.direction.value).toBe("none");
		expect(swipe.isSwiping.value).toBe(false);

		threshold.value = 20;
		element.dispatchEvent(touchMove(30, 0));
		expect(swipe.direction.value).toBe("right");
		expect(swipe.isSwiping.value).toBe(true);

		swipe.stop();
	});

	it("ignores multi-touch events", () => {
		const onSwipeStart = vi.fn();
		const onSwipe = vi.fn();
		const swipe = useSwipe(element, {
			onSwipe,
			onSwipeStart,
			threshold: 10,
		});

		element.dispatchEvent(
			touchEvent("touchstart", [
				{ clientX: 0, clientY: 0 },
				{ clientX: 20, clientY: 0 },
			]),
		);
		element.dispatchEvent(
			touchEvent("touchmove", [
				{ clientX: 40, clientY: 0 },
				{ clientX: 60, clientY: 0 },
			]),
		);

		expect(swipe.coordsStart.value).toEqual({ x: 0, y: 0 });
		expect(swipe.coordsEnd.value).toEqual({ x: 0, y: 0 });
		expect(swipe.isSwiping.value).toBe(false);
		expect(onSwipeStart).not.toHaveBeenCalled();
		expect(onSwipe).not.toHaveBeenCalled();

		swipe.stop();
	});

	it("prevents cancelable horizontal touchmove only when passive is false", () => {
		const passiveSwipe = useSwipe(element, { passive: true, threshold: 10 });
		const passiveMove = touchMove(30, 5);
		const passivePreventDefault = vi.spyOn(passiveMove, "preventDefault");

		element.dispatchEvent(touchStart(0, 0));
		element.dispatchEvent(passiveMove);
		expect(passivePreventDefault).not.toHaveBeenCalled();
		passiveSwipe.stop();

		const activeSwipe = useSwipe(element, { passive: false, threshold: 10 });
		const activeMove = touchMove(30, 5);
		const activePreventDefault = vi.spyOn(activeMove, "preventDefault");
		const verticalMove = touchMove(32, 50);
		const verticalPreventDefault = vi.spyOn(verticalMove, "preventDefault");
		const uncancelableMove = touchMove(70, 5, { cancelable: false });
		const uncancelablePreventDefault = vi.spyOn(
			uncancelableMove,
			"preventDefault",
		);

		element.dispatchEvent(touchStart(0, 0));
		element.dispatchEvent(activeMove);
		element.dispatchEvent(verticalMove);
		element.dispatchEvent(uncancelableMove);

		expect(activePreventDefault).toHaveBeenCalledOnce();
		expect(verticalPreventDefault).not.toHaveBeenCalled();
		expect(uncancelablePreventDefault).not.toHaveBeenCalled();

		activeSwipe.stop();
	});

	it("uses passive listener options by default and capture when passive is false", () => {
		const addSpy = vi.spyOn(element, "addEventListener");
		const swipe = useSwipe(element);

		expect(addSpy).toHaveBeenCalledWith("touchstart", expect.any(Function), {
			capture: false,
			passive: true,
		});
		swipe.stop();

		addSpy.mockClear();
		const activeSwipe = useSwipe(element, { passive: false });

		expect(addSpy).toHaveBeenCalledWith("touchstart", expect.any(Function), {
			capture: true,
			passive: false,
		});

		activeSwipe.stop();
	});

	it("removes old listeners when the target changes", () => {
		const nextElement = document.createElement("div");
		document.body.append(nextElement);
		const target = signal<EventTarget | null>(element);
		const swipe = useSwipe(target, { threshold: 10 });

		target.value = nextElement;

		element.dispatchEvent(touchStart(0, 0));
		element.dispatchEvent(touchMove(40, 0));
		expect(swipe.direction.value).toBe("none");
		expect(swipe.isSwiping.value).toBe(false);

		nextElement.dispatchEvent(touchStart(0, 0));
		nextElement.dispatchEvent(touchMove(40, 0));
		expect(swipe.direction.value).toBe("right");
		expect(swipe.isSwiping.value).toBe(true);

		swipe.stop();
	});

	it("registers explicit target listeners when window is null", () => {
		const addSpy = vi.spyOn(element, "addEventListener");
		const swipe = useSwipe(element, { threshold: 10, window: null });

		element.dispatchEvent(touchStart(0, 0));
		element.dispatchEvent(touchMove(40, 0));
		expect(addSpy).toHaveBeenCalledWith("touchstart", expect.any(Function), {
			capture: false,
			passive: true,
		});
		expect(swipe.direction.value).toBe("right");
		expect(swipe.isSwiping.value).toBe(true);

		swipe.stop();
	});

	it("does not swallow callback errors", () => {
		const error = new Error("swipe failed");
		const addSpy = vi.spyOn(element, "addEventListener");
		const swipe = useSwipe(element, {
			onSwipeStart: () => {
				throw error;
			},
		});
		const touchStartListener = addSpy.mock.calls.find(
			([type]) => type === "touchstart",
		)?.[1] as EventListener;

		expect(() => touchStartListener(touchStart(0, 0))).toThrow(error);

		swipe.stop();
	});
});
