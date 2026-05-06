import { disposeTrackedMolecules, signal } from "@sigrea/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useMouseInElement } from "./index";

interface RectValues {
	height: number;
	left: number;
	top: number;
	width: number;
}

class FakeResizeObserver implements ResizeObserver {
	static instances: FakeResizeObserver[] = [];

	readonly observed = new Set<Element>();

	constructor(private readonly callback: ResizeObserverCallback) {
		FakeResizeObserver.instances.push(this);
	}

	observe(target: Element) {
		this.observed.add(target);
	}

	unobserve(target: Element) {
		this.observed.delete(target);
	}

	disconnect() {
		this.observed.clear();
	}

	emit(target: Element) {
		if (!this.observed.has(target)) {
			return;
		}

		this.callback([{ target } as ResizeObserverEntry], this);
	}
}

class FakeMutationObserver implements MutationObserver {
	static instances: FakeMutationObserver[] = [];

	readonly observed = new Map<Node, MutationObserverInit>();

	constructor(private readonly callback: MutationCallback) {
		FakeMutationObserver.instances.push(this);
	}

	observe(target: Node, options?: MutationObserverInit) {
		this.observed.set(target, options ?? {});
	}

	disconnect() {
		this.observed.clear();
	}

	takeRecords(): MutationRecord[] {
		return [];
	}

	emit(target: Node, attributeName = "style") {
		if (!this.observed.has(target)) {
			return;
		}

		this.callback(
			[
				{
					attributeName,
					target,
					type: "attributes",
				} as MutationRecord,
			],
			this,
		);
	}
}

class FakeWindow extends EventTarget {
	document = document;
	navigator = navigator;
	scrollX = 0;
	scrollY = 0;
	ResizeObserver = FakeResizeObserver as typeof ResizeObserver;
	MutationObserver = FakeMutationObserver as typeof MutationObserver;

	setScroll(x: number, y: number) {
		this.scrollX = x;
		this.scrollY = y;
		this.dispatchEvent(new Event("scroll"));
	}
}

class FakeWindowWithoutObservers extends EventTarget {
	document = document;
	navigator = navigator;
	scrollX = 0;
	scrollY = 0;
}

function mouseEvent(
	type: string,
	values: Partial<Pick<MouseEvent, "pageX" | "pageY" | "clientX" | "clientY">>,
): MouseEvent {
	const event = new MouseEvent(type, {
		clientX: values.clientX,
		clientY: values.clientY,
	});
	Object.defineProperties(event, {
		pageX: { value: values.pageX ?? values.clientX ?? 0 },
		pageY: { value: values.pageY ?? values.clientY ?? 0 },
	});

	return event;
}

function rect(values: RectValues): DOMRect {
	return {
		bottom: values.top + values.height,
		height: values.height,
		left: values.left,
		right: values.left + values.width,
		top: values.top,
		width: values.width,
		x: values.left,
		y: values.top,
		toJSON: () => values,
	} as DOMRect;
}

function setClientRects(element: Element, values: RectValues[]) {
	Object.defineProperty(element, "getClientRects", {
		configurable: true,
		value: () => values.map(rect) as unknown as DOMRectList,
	});
}

describe("useMouseInElement", () => {
	afterEach(() => {
		FakeResizeObserver.instances = [];
		FakeMutationObserver.instances = [];
		document.body.innerHTML = "";
		disposeTrackedMolecules();
	});

	it("tracks mouse coordinates relative to a block element", () => {
		const fakeWindow = new FakeWindow();
		const element = document.createElement("div");
		setClientRects(element, [{ height: 20, left: 10, top: 5, width: 30 }]);
		const state = useMouseInElement(element, { window: fakeWindow });

		expect(state.elementWidth.value).toBe(30);
		expect(state.elementHeight.value).toBe(20);
		expect(state.elementPositionX.value).toBe(10);
		expect(state.elementPositionY.value).toBe(5);
		expect(state.elementX.value).toBe(-10);
		expect(state.elementY.value).toBe(-5);
		expect(state.isOutside.value).toBe(true);

		fakeWindow.dispatchEvent(mouseEvent("mousemove", { pageX: 20, pageY: 15 }));

		expect(state.x.value).toBe(20);
		expect(state.y.value).toBe(15);
		expect(state.sourceType.value).toBe("mouse");
		expect(state.elementX.value).toBe(10);
		expect(state.elementY.value).toBe(10);
		expect(state.isOutside.value).toBe(false);

		document.dispatchEvent(new MouseEvent("mouseleave"));
		expect(state.isOutside.value).toBe(true);

		state.stop();
	});

	it("keeps the last inside coordinates when outside handling is disabled", () => {
		const fakeWindow = new FakeWindow();
		const element = document.createElement("div");
		setClientRects(element, [{ height: 20, left: 10, top: 10, width: 20 }]);
		const state = useMouseInElement(element, {
			handleOutside: false,
			window: fakeWindow,
		});

		fakeWindow.dispatchEvent(mouseEvent("mousemove", { pageX: 15, pageY: 15 }));
		expect(state.elementX.value).toBe(5);
		expect(state.elementY.value).toBe(5);
		expect(state.isOutside.value).toBe(false);

		fakeWindow.dispatchEvent(mouseEvent("mousemove", { pageX: 50, pageY: 60 }));
		expect(state.elementX.value).toBe(5);
		expect(state.elementY.value).toBe(5);
		expect(state.isOutside.value).toBe(true);

		state.stop();
	});

	it("uses client coordinates without adding scroll offsets", () => {
		const fakeWindow = new FakeWindow();
		fakeWindow.scrollX = 100;
		fakeWindow.scrollY = 200;
		const element = document.createElement("div");
		setClientRects(element, [{ height: 20, left: 10, top: 20, width: 30 }]);
		const state = useMouseInElement(element, {
			type: "client",
			window: fakeWindow,
		});

		fakeWindow.dispatchEvent(
			mouseEvent("mousemove", {
				clientX: 25,
				clientY: 35,
				pageX: 125,
				pageY: 235,
			}),
		);

		expect(state.elementPositionX.value).toBe(10);
		expect(state.elementPositionY.value).toBe(20);
		expect(state.elementX.value).toBe(15);
		expect(state.elementY.value).toBe(15);

		state.stop();
	});

	it("checks each client rect for inline elements", () => {
		const fakeWindow = new FakeWindow();
		const element = document.createElement("span");
		setClientRects(element, [
			{ height: 10, left: 0, top: 0, width: 20 },
			{ height: 10, left: 0, top: 30, width: 20 },
		]);
		const state = useMouseInElement(element, { window: fakeWindow });

		fakeWindow.dispatchEvent(mouseEvent("mousemove", { pageX: 5, pageY: 5 }));
		expect(state.isOutside.value).toBe(false);
		expect(state.elementY.value).toBe(5);

		fakeWindow.dispatchEvent(mouseEvent("mousemove", { pageX: 5, pageY: 20 }));
		expect(state.isOutside.value).toBe(true);

		fakeWindow.dispatchEvent(mouseEvent("mousemove", { pageX: 5, pageY: 35 }));
		expect(state.isOutside.value).toBe(false);
		expect(state.elementPositionY.value).toBe(30);
		expect(state.elementY.value).toBe(5);

		state.stop();
	});

	it("refreshes element bounds on each mouse movement", () => {
		const fakeWindow = new FakeWindowWithoutObservers();
		const element = document.createElement("div");
		setClientRects(element, [{ height: 20, left: 10, top: 10, width: 20 }]);
		const state = useMouseInElement(element, { window: fakeWindow });

		fakeWindow.dispatchEvent(mouseEvent("mousemove", { pageX: 15, pageY: 15 }));
		expect(state.elementPositionX.value).toBe(10);
		expect(state.elementX.value).toBe(5);
		expect(state.isOutside.value).toBe(false);

		setClientRects(element, [{ height: 20, left: 30, top: 10, width: 20 }]);
		fakeWindow.dispatchEvent(mouseEvent("mousemove", { pageX: 35, pageY: 15 }));
		expect(state.elementPositionX.value).toBe(30);
		expect(state.elementX.value).toBe(5);
		expect(state.isOutside.value).toBe(false);

		state.stop();
	});

	it("updates bounds from observers and window events", () => {
		const fakeWindow = new FakeWindow();
		const element = document.createElement("div");
		setClientRects(element, [{ height: 20, left: 10, top: 10, width: 20 }]);
		const state = useMouseInElement(element, { window: fakeWindow });

		expect(FakeResizeObserver.instances[0]?.observed.has(element)).toBe(true);
		expect(FakeMutationObserver.instances[0]?.observed.get(element)).toEqual({
			attributeFilter: ["style", "class"],
			attributes: true,
		});

		setClientRects(element, [{ height: 40, left: 20, top: 25, width: 50 }]);
		FakeResizeObserver.instances[0]?.emit(element);
		expect(state.elementWidth.value).toBe(50);
		expect(state.elementHeight.value).toBe(40);
		expect(state.elementPositionX.value).toBe(20);
		expect(state.elementPositionY.value).toBe(25);

		setClientRects(element, [{ height: 10, left: 3, top: 4, width: 12 }]);
		FakeMutationObserver.instances[0]?.emit(element, "class");
		expect(state.elementWidth.value).toBe(12);
		expect(state.elementHeight.value).toBe(10);

		fakeWindow.setScroll(5, 7);
		expect(state.elementPositionX.value).toBe(8);
		expect(state.elementPositionY.value).toBe(11);

		setClientRects(element, [{ height: 15, left: 6, top: 8, width: 18 }]);
		fakeWindow.dispatchEvent(new Event("resize"));
		expect(state.elementWidth.value).toBe(18);
		expect(state.elementHeight.value).toBe(15);

		state.stop();
	});

	it("can disable window scroll and resize updates", () => {
		const fakeWindow = new FakeWindowWithoutObservers();
		const element = document.createElement("div");
		setClientRects(element, [{ height: 20, left: 10, top: 10, width: 20 }]);
		const state = useMouseInElement(element, {
			window: fakeWindow,
			windowResize: false,
			windowScroll: false,
		});

		fakeWindow.dispatchEvent(mouseEvent("mousemove", { pageX: 15, pageY: 15 }));
		setClientRects(element, [{ height: 50, left: 30, top: 40, width: 60 }]);
		fakeWindow.scrollX = 5;
		fakeWindow.scrollY = 7;
		fakeWindow.dispatchEvent(new Event("scroll"));
		fakeWindow.dispatchEvent(new Event("resize"));

		expect(state.x.value).toBe(20);
		expect(state.y.value).toBe(22);
		expect(state.elementX.value).toBe(10);
		expect(state.elementY.value).toBe(12);
		expect(state.elementWidth.value).toBe(20);
		expect(state.elementHeight.value).toBe(20);
		expect(state.elementPositionX.value).toBe(10);
		expect(state.elementPositionY.value).toBe(10);

		state.stop();
	});

	it("accepts element-like values from another realm", () => {
		const fakeWindow = new FakeWindowWithoutObservers();
		const elementLike = {
			getClientRects: () =>
				[
					rect({ height: 30, left: 10, top: 20, width: 40 }),
				] as unknown as DOMRectList,
		} as unknown as Element;
		const state = useMouseInElement(elementLike, { window: fakeWindow });

		fakeWindow.dispatchEvent(mouseEvent("mousemove", { pageX: 20, pageY: 30 }));

		expect(state.elementPositionX.value).toBe(10);
		expect(state.elementPositionY.value).toBe(20);
		expect(state.elementWidth.value).toBe(40);
		expect(state.elementHeight.value).toBe(30);
		expect(state.elementX.value).toBe(10);
		expect(state.elementY.value).toBe(10);
		expect(state.isOutside.value).toBe(false);

		state.stop();
	});

	it("retargets observers when the target changes", () => {
		const fakeWindow = new FakeWindow();
		const first = document.createElement("div");
		const second = document.createElement("div");
		setClientRects(first, [{ height: 20, left: 10, top: 10, width: 20 }]);
		setClientRects(second, [{ height: 30, left: 50, top: 60, width: 40 }]);
		const target = signal<Element | null>(first);
		const state = useMouseInElement(target, { window: fakeWindow });

		expect(state.elementPositionX.value).toBe(10);
		expect(FakeResizeObserver.instances[0]?.observed.has(first)).toBe(true);

		target.value = second;
		expect(FakeResizeObserver.instances[0]?.observed.has(first)).toBe(false);
		expect(FakeResizeObserver.instances[1]?.observed.has(second)).toBe(true);
		expect(state.elementPositionX.value).toBe(50);
		expect(state.elementPositionY.value).toBe(60);
		expect(state.elementWidth.value).toBe(40);
		expect(state.elementHeight.value).toBe(30);

		state.stop();
	});

	it("does not fall back to body when a reactive target is unresolved", () => {
		const fakeWindow = new FakeWindow();
		const element = document.createElement("div");
		setClientRects(document.body, [
			{ height: 100, left: 0, top: 0, width: 100 },
		]);
		setClientRects(element, [{ height: 30, left: 50, top: 60, width: 40 }]);
		const target = signal<Element | null>(null);
		const state = useMouseInElement(target, { window: fakeWindow });

		fakeWindow.dispatchEvent(mouseEvent("mousemove", { pageX: 10, pageY: 10 }));
		expect(state.elementWidth.value).toBe(0);
		expect(state.elementHeight.value).toBe(0);
		expect(state.isOutside.value).toBe(true);

		target.value = element;
		expect(state.elementPositionX.value).toBe(50);
		expect(state.elementPositionY.value).toBe(60);
		expect(state.elementWidth.value).toBe(40);
		expect(state.elementHeight.value).toBe(30);

		target.value = null;
		expect(state.elementPositionX.value).toBe(0);
		expect(state.elementPositionY.value).toBe(0);
		expect(state.elementWidth.value).toBe(0);
		expect(state.elementHeight.value).toBe(0);
		expect(state.isOutside.value).toBe(true);

		state.stop();
	});

	it("stops mouse, observer, and window updates", () => {
		const fakeWindow = new FakeWindow();
		const element = document.createElement("div");
		setClientRects(element, [{ height: 20, left: 10, top: 10, width: 20 }]);
		const state = useMouseInElement(element, { window: fakeWindow });

		fakeWindow.dispatchEvent(mouseEvent("mousemove", { pageX: 15, pageY: 15 }));
		expect(state.elementX.value).toBe(5);
		state.stop();

		fakeWindow.dispatchEvent(mouseEvent("mousemove", { pageX: 18, pageY: 18 }));
		setClientRects(element, [{ height: 50, left: 30, top: 40, width: 60 }]);
		FakeResizeObserver.instances[0]?.emit(element);
		fakeWindow.dispatchEvent(new Event("resize"));

		expect(state.x.value).toBe(15);
		expect(state.y.value).toBe(15);
		expect(state.elementX.value).toBe(5);
		expect(state.elementWidth.value).toBe(20);
	});

	it("does not fall back to the default window when window is null", () => {
		const addSpy = vi.spyOn(window, "addEventListener");
		const state = useMouseInElement(null, { window: null });

		expect(addSpy).not.toHaveBeenCalled();
		window.dispatchEvent(mouseEvent("mousemove", { pageX: 20, pageY: 30 }));
		expect(state.x.value).toBe(0);
		expect(state.y.value).toBe(0);
		expect(state.elementX.value).toBe(0);
		expect(state.elementY.value).toBe(0);
		expect(state.isOutside.value).toBe(true);

		state.stop();
		addSpy.mockRestore();
	});
});
