import { signal } from "@sigrea/core";
import {
	afterAll,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from "vitest";

import type { Position } from "../types";
import { useDraggable } from "./index";

function setRect(element: Element, rect: Partial<DOMRectReadOnly>): void {
	const left = rect.left ?? 0;
	const top = rect.top ?? 0;
	const width = rect.width ?? 0;
	const height = rect.height ?? 0;
	const right = rect.right ?? left + width;
	const bottom = rect.bottom ?? top + height;
	Object.defineProperty(element, "getBoundingClientRect", {
		configurable: true,
		value: () => ({
			bottom,
			height,
			left,
			right,
			toJSON: () => ({}),
			top,
			width,
			x: rect.x ?? left,
			y: rect.y ?? top,
		}),
	});
}

function setElementSize(
	element: Element,
	size: Partial<
		Pick<
			HTMLElement,
			"clientHeight" | "clientWidth" | "scrollHeight" | "scrollWidth"
		>
	>,
): void {
	for (const [key, value] of Object.entries(size)) {
		Object.defineProperty(element, key, {
			configurable: true,
			value,
		});
	}
}

describe("useDraggable", () => {
	let nativePointerEvent: typeof PointerEvent | undefined;
	let element: HTMLElement;
	let child: HTMLElement;
	let draggingElement: HTMLElement;

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

	beforeEach(() => {
		element = document.createElement("div");
		child = document.createElement("button");
		draggingElement = document.createElement("div");
		element.appendChild(child);
		setRect(element, { height: 20, left: 10, top: 20, width: 30 });
	});

	function pointerEvent(
		type: string,
		options: PointerEventInit = {},
	): PointerEvent {
		return new PointerEvent(type, {
			bubbles: true,
			button: 0,
			cancelable: true,
			clientX: 0,
			clientY: 0,
			pointerId: 1,
			pointerType: "mouse",
			...options,
		});
	}

	it("uses the initial position and style", () => {
		const draggable = useDraggable(element, {
			initialValue: { x: 4, y: 8 },
			draggingElement,
		});

		expect(draggable.x.value).toBe(4);
		expect(draggable.y.value).toBe(8);
		expect(draggable.position.value).toEqual({ x: 4, y: 8 });
		expect(draggable.isDragging.value).toBe(false);
		expect(draggable.style.value).toBe("left: 4px; top: 8px;");

		draggable.stop();
	});

	it("updates position while dragging", () => {
		const onStart = vi.fn();
		const onMove = vi.fn();
		const onEnd = vi.fn();
		const draggable = useDraggable(element, {
			draggingElement,
			onEnd,
			onMove,
			onStart,
		});

		element.dispatchEvent(
			pointerEvent("pointerdown", { clientX: 15, clientY: 25 }),
		);
		expect(draggable.isDragging.value).toBe(true);
		expect(onStart).toHaveBeenCalledWith(
			{ x: 5, y: 5 },
			expect.any(PointerEvent),
		);

		draggingElement.dispatchEvent(
			pointerEvent("pointermove", { clientX: 50, clientY: 70 }),
		);

		expect(draggable.position.value).toEqual({ x: 45, y: 65 });
		expect(onMove).toHaveBeenCalledWith(
			{ x: 45, y: 65 },
			expect.any(PointerEvent),
		);

		draggingElement.dispatchEvent(
			pointerEvent("pointerup", { clientX: 50, clientY: 70 }),
		);
		expect(draggable.isDragging.value).toBe(false);
		expect(onEnd).toHaveBeenCalledWith(
			{ x: 45, y: 65 },
			expect.any(PointerEvent),
		);

		draggable.stop();
	});

	it("does not start dragging when onStart returns false", () => {
		const draggable = useDraggable(element, {
			draggingElement,
			onStart: () => false,
		});

		element.dispatchEvent(
			pointerEvent("pointerdown", { clientX: 15, clientY: 25 }),
		);
		draggingElement.dispatchEvent(
			pointerEvent("pointermove", { clientX: 50, clientY: 70 }),
		);

		expect(draggable.isDragging.value).toBe(false);
		expect(draggable.position.value).toEqual({ x: 0, y: 0 });

		draggable.stop();
	});

	it("filters disabled state, pointer type, button, and exact target", () => {
		const disabled = useDraggable(element, {
			disabled: true,
			draggingElement,
		});
		element.dispatchEvent(
			pointerEvent("pointerdown", { clientX: 15, clientY: 25 }),
		);
		expect(disabled.isDragging.value).toBe(false);
		disabled.stop();

		const pointerFiltered = useDraggable(element, {
			draggingElement,
			pointerTypes: ["touch"],
		});
		element.dispatchEvent(
			pointerEvent("pointerdown", {
				clientX: 15,
				clientY: 25,
				pointerType: "mouse",
			}),
		);
		expect(pointerFiltered.isDragging.value).toBe(false);
		pointerFiltered.stop();

		const buttonFiltered = useDraggable(element, {
			buttons: [2],
			draggingElement,
		});
		element.dispatchEvent(
			pointerEvent("pointerdown", { button: 0, clientX: 15, clientY: 25 }),
		);
		expect(buttonFiltered.isDragging.value).toBe(false);
		buttonFiltered.stop();

		const exact = useDraggable(element, {
			draggingElement,
			exact: true,
		});
		child.dispatchEvent(
			pointerEvent("pointerdown", { clientX: 15, clientY: 25 }),
		);
		expect(exact.isDragging.value).toBe(false);
		exact.stop();
	});

	it("restricts movement to one axis", () => {
		const xOnly = useDraggable(element, {
			axis: "x",
			draggingElement,
			initialValue: { x: 1, y: 2 },
		});

		element.dispatchEvent(
			pointerEvent("pointerdown", { clientX: 15, clientY: 25 }),
		);
		draggingElement.dispatchEvent(
			pointerEvent("pointermove", { clientX: 50, clientY: 70 }),
		);

		expect(xOnly.position.value).toEqual({ x: 45, y: 2 });
		xOnly.stop();

		const yOnly = useDraggable(element, {
			axis: "y",
			draggingElement,
			initialValue: { x: 1, y: 2 },
		});

		element.dispatchEvent(
			pointerEvent("pointerdown", { clientX: 15, clientY: 25 }),
		);
		draggingElement.dispatchEvent(
			pointerEvent("pointermove", { clientX: 50, clientY: 70 }),
		);

		expect(yOnly.position.value).toEqual({ x: 1, y: 65 });
		yOnly.stop();
	});

	it("uses a handle and dragging element", () => {
		const handle = document.createElement("button");
		const otherDraggingElement = document.createElement("div");
		const draggable = useDraggable(element, {
			draggingElement,
			handle,
		});

		element.dispatchEvent(
			pointerEvent("pointerdown", { clientX: 15, clientY: 25 }),
		);
		draggingElement.dispatchEvent(
			pointerEvent("pointermove", { clientX: 50, clientY: 70 }),
		);
		expect(draggable.position.value).toEqual({ x: 0, y: 0 });

		handle.dispatchEvent(
			pointerEvent("pointerdown", { clientX: 15, clientY: 25 }),
		);
		otherDraggingElement.dispatchEvent(
			pointerEvent("pointermove", { clientX: 50, clientY: 70 }),
		);
		expect(draggable.position.value).toEqual({ x: 0, y: 0 });

		draggingElement.dispatchEvent(
			pointerEvent("pointermove", { clientX: 50, clientY: 70 }),
		);
		expect(draggable.position.value).toEqual({ x: 45, y: 65 });

		draggable.stop();
	});

	it("uses the handle as the exact pointerdown target", () => {
		const handle = document.createElement("button");
		const handleChild = document.createElement("span");
		handle.appendChild(handleChild);
		const draggable = useDraggable(element, {
			draggingElement,
			exact: true,
			handle,
		});

		handleChild.dispatchEvent(
			pointerEvent("pointerdown", { clientX: 15, clientY: 25 }),
		);
		draggingElement.dispatchEvent(
			pointerEvent("pointermove", { clientX: 50, clientY: 70 }),
		);
		expect(draggable.isDragging.value).toBe(false);
		expect(draggable.position.value).toEqual({ x: 0, y: 0 });

		handle.dispatchEvent(
			pointerEvent("pointerdown", { clientX: 15, clientY: 25 }),
		);
		expect(draggable.isDragging.value).toBe(true);

		draggingElement.dispatchEvent(
			pointerEvent("pointermove", { clientX: 50, clientY: 70 }),
		);
		expect(draggable.position.value).toEqual({ x: 45, y: 65 });

		draggable.stop();
	});

	it("clamps movement to a container", () => {
		const container = document.createElement("div");
		setRect(container, { left: 0, top: 0 });
		setElementSize(container, {
			scrollHeight: 120,
			scrollWidth: 100,
		});
		const draggable = useDraggable(element, {
			containerElement: container,
			draggingElement,
		});

		element.dispatchEvent(
			pointerEvent("pointerdown", { clientX: 15, clientY: 25 }),
		);
		draggingElement.dispatchEvent(
			pointerEvent("pointermove", { clientX: 200, clientY: 200 }),
		);

		expect(draggable.position.value).toEqual({ x: 70, y: 100 });

		draggingElement.dispatchEvent(
			pointerEvent("pointermove", { clientX: -100, clientY: -100 }),
		);

		expect(draggable.position.value).toEqual({ x: 0, y: 0 });

		draggable.stop();
	});

	it("handles event options", () => {
		const parent = document.createElement("div");
		const propagated = vi.fn();
		parent.appendChild(element);
		parent.addEventListener("pointerdown", propagated);
		const draggable = useDraggable(element, {
			draggingElement,
			preventDefault: true,
			stopPropagation: true,
		});
		const event = pointerEvent("pointerdown", { clientX: 15, clientY: 25 });

		element.dispatchEvent(event);

		expect(event.defaultPrevented).toBe(true);
		expect(propagated).not.toHaveBeenCalled();

		draggable.stop();
	});

	it("retargets listeners when targets change", () => {
		const firstTarget = document.createElement("div");
		const secondTarget = document.createElement("div");
		setRect(firstTarget, { height: 20, left: 10, top: 20, width: 30 });
		setRect(secondTarget, { height: 20, left: 10, top: 20, width: 30 });
		const target = signal<HTMLElement | null>(firstTarget);
		const draggable = useDraggable(target, { draggingElement });

		firstTarget.dispatchEvent(
			pointerEvent("pointerdown", { clientX: 15, clientY: 25 }),
		);
		expect(draggable.isDragging.value).toBe(true);

		target.value = secondTarget;
		expect(draggable.isDragging.value).toBe(false);

		firstTarget.dispatchEvent(
			pointerEvent("pointerdown", { clientX: 15, clientY: 25 }),
		);
		draggingElement.dispatchEvent(
			pointerEvent("pointermove", { clientX: 50, clientY: 70 }),
		);
		expect(draggable.position.value).toEqual({ x: 0, y: 0 });

		secondTarget.dispatchEvent(
			pointerEvent("pointerdown", { clientX: 15, clientY: 25 }),
		);
		draggingElement.dispatchEvent(
			pointerEvent("pointermove", { clientX: 50, clientY: 70 }),
		);
		expect(draggable.position.value).toEqual({ x: 45, y: 65 });

		draggable.stop();
	});

	it("stops updates after stop", () => {
		const onMove = vi.fn();
		const draggable = useDraggable(element, { draggingElement, onMove });

		element.dispatchEvent(
			pointerEvent("pointerdown", { clientX: 15, clientY: 25 }),
		);
		draggable.stop();
		draggingElement.dispatchEvent(
			pointerEvent("pointermove", { clientX: 50, clientY: 70 }),
		);

		expect(draggable.position.value).toEqual({ x: 0, y: 0 });
		expect(onMove).not.toHaveBeenCalled();
		expect(draggable.isDragging.value).toBe(false);
	});
});
