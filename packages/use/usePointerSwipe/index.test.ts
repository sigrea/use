import { disposeTrackedMolecules, signal } from "@sigrea/core";
import {
	afterAll,
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from "vitest";

import { usePointerSwipe } from "./index";

describe("usePointerSwipe", () => {
	let nativePointerEvent: typeof PointerEvent | undefined;
	let element: HTMLElement;

	beforeAll(() => {
		nativePointerEvent = globalThis.PointerEvent;
		if (nativePointerEvent === undefined) {
			class TestPointerEvent extends MouseEvent {
				readonly pointerId: number;
				readonly pointerType: string;

				constructor(type: string, options: PointerEventInit = {}) {
					super(type, options);
					this.pointerId = options.pointerId ?? 1;
					this.pointerType = options.pointerType ?? "mouse";
				}
			}

			vi.stubGlobal("PointerEvent", TestPointerEvent);
		}
	});

	afterAll(() => {
		if (nativePointerEvent === undefined) {
			vi.unstubAllGlobals();
		}
	});

	afterEach(() => {
		document.body.innerHTML = "";
		disposeTrackedMolecules();
		vi.restoreAllMocks();
	});

	function pointerEvent(
		type: string,
		options: PointerEventInit = {},
	): PointerEvent {
		const buttons =
			options.buttons ??
			(type === "pointerup" || type === "pointercancel" ? 0 : 1);

		return new PointerEvent(type, {
			bubbles: true,
			button: 0,
			buttons,
			cancelable: true,
			clientX: 0,
			clientY: 0,
			pointerId: 1,
			pointerType: "mouse",
			...options,
		});
	}

	beforeEach(() => {
		element = document.createElement("div");
		document.body.appendChild(element);
	});

	it("uses initial state and ignores null targets", () => {
		const addSpy = vi.spyOn(window, "addEventListener");
		const swipe = usePointerSwipe(null);

		expect(addSpy).not.toHaveBeenCalled();
		expect(swipe.isSwiping.value).toBe(false);
		expect(swipe.direction.value).toBe("none");
		expect(swipe.posStart.value).toEqual({ x: 0, y: 0 });
		expect(swipe.posEnd.value).toEqual({ x: 0, y: 0 });
		expect(swipe.distanceX.value).toBe(0);
		expect(swipe.distanceY.value).toBe(0);

		window.dispatchEvent(pointerEvent("pointerdown", { clientX: 10 }));
		expect(swipe.posStart.value).toEqual({ x: 0, y: 0 });

		swipe.stop();
	});

	it("tracks a swipe and ends on pointerup", () => {
		const setPointerCapture = vi.fn();
		const releasePointerCapture = vi.fn();
		element.setPointerCapture = setPointerCapture;
		element.releasePointerCapture = releasePointerCapture;
		const onSwipeStart = vi.fn();
		const onSwipe = vi.fn();
		const onSwipeEnd = vi.fn();
		const swipe = usePointerSwipe(element, {
			onSwipe,
			onSwipeEnd,
			onSwipeStart,
			threshold: 20,
		});
		const down = pointerEvent("pointerdown", {
			clientX: 100,
			clientY: 50,
			pointerId: 3,
		});
		const move = pointerEvent("pointermove", {
			clientX: 70,
			clientY: 55,
			pointerId: 3,
		});
		const up = pointerEvent("pointerup", {
			clientX: 70,
			clientY: 55,
			pointerId: 3,
		});

		element.dispatchEvent(down);
		expect(setPointerCapture).toHaveBeenCalledWith(3);
		expect(onSwipeStart).toHaveBeenCalledWith(down);
		expect(swipe.posStart.value).toEqual({ x: 100, y: 50 });
		expect(swipe.posEnd.value).toEqual({ x: 100, y: 50 });
		expect(swipe.isSwiping.value).toBe(false);

		element.dispatchEvent(move);
		expect(swipe.posEnd.value).toEqual({ x: 70, y: 55 });
		expect(swipe.distanceX.value).toBe(30);
		expect(swipe.distanceY.value).toBe(-5);
		expect(swipe.direction.value).toBe("left");
		expect(swipe.isSwiping.value).toBe(true);
		expect(onSwipe).toHaveBeenCalledWith(move);

		element.dispatchEvent(up);
		expect(swipe.isSwiping.value).toBe(false);
		expect(swipe.direction.value).toBe("left");
		expect(onSwipeEnd).toHaveBeenCalledWith(up, "left");
		expect(releasePointerCapture).toHaveBeenCalledWith(3);

		swipe.stop();
	});

	it("detects vertical direction after threshold", () => {
		const swipe = usePointerSwipe(element, { threshold: 10 });

		element.dispatchEvent(
			pointerEvent("pointerdown", { clientX: 10, clientY: 10 }),
		);
		element.dispatchEvent(
			pointerEvent("pointermove", { clientX: 12, clientY: 30 }),
		);

		expect(swipe.direction.value).toBe("down");
		expect(swipe.isSwiping.value).toBe(true);

		swipe.stop();
	});

	it("ends an active swipe on pointercancel", () => {
		const onSwipeEnd = vi.fn();
		const swipe = usePointerSwipe(element, {
			onSwipeEnd,
			threshold: 10,
		});
		const cancel = pointerEvent("pointercancel", {
			clientX: 40,
			clientY: 0,
		});

		element.dispatchEvent(
			pointerEvent("pointerdown", { clientX: 0, clientY: 0 }),
		);
		element.dispatchEvent(
			pointerEvent("pointermove", { clientX: 40, clientY: 0 }),
		);
		expect(swipe.isSwiping.value).toBe(true);

		element.dispatchEvent(cancel);
		expect(swipe.isSwiping.value).toBe(false);
		expect(onSwipeEnd).toHaveBeenCalledWith(cancel, "right");

		swipe.stop();
	});

	it("ends on pointercancel even when the button state changes", () => {
		const swipe = usePointerSwipe(element, { threshold: 10 });

		element.dispatchEvent(
			pointerEvent("pointerdown", { buttons: 1, clientX: 0 }),
		);
		element.dispatchEvent(
			pointerEvent("pointermove", { buttons: 1, clientX: 40 }),
		);
		expect(swipe.isSwiping.value).toBe(true);

		element.dispatchEvent(
			pointerEvent("pointercancel", { buttons: 2, clientX: 40 }),
		);
		expect(swipe.isSwiping.value).toBe(false);

		swipe.stop();
	});

	it("ends when pointer types change during an active swipe", () => {
		const pointerTypes = signal<readonly string[]>(["mouse"]);
		const swipe = usePointerSwipe(element, { pointerTypes, threshold: 10 });

		element.dispatchEvent(
			pointerEvent("pointerdown", { clientX: 0, pointerType: "mouse" }),
		);
		element.dispatchEvent(
			pointerEvent("pointermove", { clientX: 40, pointerType: "mouse" }),
		);
		expect(swipe.isSwiping.value).toBe(true);

		pointerTypes.value = ["touch"];
		element.dispatchEvent(
			pointerEvent("pointerup", { clientX: 40, pointerType: "mouse" }),
		);

		expect(swipe.isSwiping.value).toBe(false);

		pointerTypes.value = ["mouse"];
		element.dispatchEvent(
			pointerEvent("pointerdown", { clientX: 0, pointerType: "mouse" }),
		);
		element.dispatchEvent(
			pointerEvent("pointermove", { clientX: 40, pointerType: "mouse" }),
		);
		expect(swipe.isSwiping.value).toBe(true);

		swipe.stop();
	});

	it("filters pointer types and default button state", () => {
		const swipe = usePointerSwipe(element, { pointerTypes: ["touch"] });

		element.dispatchEvent(
			pointerEvent("pointerdown", { pointerType: "mouse" }),
		);
		element.dispatchEvent(
			pointerEvent("pointermove", { clientX: 80, pointerType: "mouse" }),
		);
		expect(swipe.isSwiping.value).toBe(false);
		expect(swipe.distanceX.value).toBe(0);

		element.dispatchEvent(
			pointerEvent("pointerdown", { pointerType: "touch" }),
		);
		element.dispatchEvent(
			pointerEvent("pointermove", {
				clientX: 80,
				pointerType: "touch",
			}),
		);
		expect(swipe.direction.value).toBe("right");
		expect(swipe.isSwiping.value).toBe(true);
		swipe.stop();

		const mouseSwipe = usePointerSwipe(element);
		element.dispatchEvent(
			pointerEvent("pointerdown", { buttons: 2, clientX: 0 }),
		);
		element.dispatchEvent(
			pointerEvent("pointermove", { buttons: 2, clientX: 80 }),
		);
		expect(mouseSwipe.isSwiping.value).toBe(false);

		mouseSwipe.stop();

		const filteredMouseSwipe = usePointerSwipe(element, {
			pointerTypes: ["mouse"],
		});
		element.dispatchEvent(
			pointerEvent("pointerdown", {
				button: 2,
				buttons: 2,
				pointerType: "mouse",
			}),
		);
		element.dispatchEvent(
			pointerEvent("pointermove", {
				buttons: 2,
				clientX: 80,
				pointerType: "mouse",
			}),
		);
		expect(filteredMouseSwipe.isSwiping.value).toBe(false);

		filteredMouseSwipe.stop();
	});

	it("handles event options", () => {
		const parent = document.createElement("div");
		const propagated = vi.fn();
		parent.appendChild(element);
		parent.addEventListener("pointerdown", propagated);
		const swipe = usePointerSwipe(element, {
			preventDefault: true,
			stopPropagation: true,
		});
		const event = pointerEvent("pointerdown");

		element.dispatchEvent(event);

		expect(event.defaultPrevented).toBe(true);
		expect(propagated).not.toHaveBeenCalled();

		swipe.stop();
	});

	it("updates listener options and styles from reactive options", () => {
		const capture = signal(false);
		const disableTextSelect = signal(true);
		const addSpy = vi.spyOn(element, "addEventListener");
		const initialTouchAction = element.style.touchAction;
		const swipe = usePointerSwipe(element, {
			capture,
			disableTextSelect,
		});

		expect(addSpy).toHaveBeenCalledWith(
			"pointerdown",
			expect.any(Function),
			expect.objectContaining({ capture: false, passive: true }),
		);
		expect(element.style.touchAction).toBe("pan-y");
		expect(element.style.userSelect).toBe("none");

		capture.value = true;
		expect(addSpy).toHaveBeenCalledWith(
			"pointerdown",
			expect.any(Function),
			expect.objectContaining({ capture: true, passive: true }),
		);

		swipe.stop();
		expect(element.style.touchAction).toBe(initialTouchAction);
		expect(element.style.userSelect).toBe("");
	});

	it("resets an active swipe when the target changes", () => {
		const first = document.createElement("div");
		const second = document.createElement("div");
		const target = signal<HTMLElement | null>(first);
		const onSwipe = vi.fn();
		const releasePointerCapture = vi.fn();
		first.releasePointerCapture = releasePointerCapture;
		const swipe = usePointerSwipe(target, { onSwipe, threshold: 10 });

		first.dispatchEvent(pointerEvent("pointerdown", { clientX: 0 }));
		first.dispatchEvent(pointerEvent("pointermove", { clientX: 30 }));
		expect(swipe.isSwiping.value).toBe(true);

		target.value = second;
		expect(swipe.isSwiping.value).toBe(false);
		expect(swipe.direction.value).toBe("none");
		expect(releasePointerCapture).toHaveBeenCalledWith(1);

		first.dispatchEvent(pointerEvent("pointermove", { clientX: 60 }));
		expect(onSwipe).toHaveBeenCalledTimes(1);

		second.dispatchEvent(pointerEvent("pointerdown", { clientX: 0 }));
		second.dispatchEvent(pointerEvent("pointermove", { clientX: 30 }));
		expect(swipe.isSwiping.value).toBe(true);
		expect(onSwipe).toHaveBeenCalledTimes(2);

		swipe.stop();
	});

	it("stops listeners and resets active state", () => {
		const onSwipe = vi.fn();
		const releasePointerCapture = vi.fn();
		element.releasePointerCapture = releasePointerCapture;
		const swipe = usePointerSwipe(element, { onSwipe, threshold: 10 });

		element.dispatchEvent(pointerEvent("pointerdown", { clientX: 0 }));
		element.dispatchEvent(pointerEvent("pointermove", { clientX: 30 }));
		expect(swipe.isSwiping.value).toBe(true);

		swipe.stop();
		expect(swipe.isSwiping.value).toBe(false);
		expect(swipe.direction.value).toBe("none");
		expect(releasePointerCapture).toHaveBeenCalledWith(1);

		element.dispatchEvent(pointerEvent("pointerdown", { clientX: 0 }));
		element.dispatchEvent(pointerEvent("pointermove", { clientX: 60 }));
		expect(onSwipe).toHaveBeenCalledTimes(1);
	});
});
