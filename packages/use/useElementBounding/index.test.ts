import { disposeTrackedMolecules, signal } from "@sigrea/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useElementBounding } from "./index";

interface RectValues {
	bottom: number;
	height: number;
	left: number;
	right: number;
	top: number;
	width: number;
	x: number;
	y: number;
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
	ResizeObserver = FakeResizeObserver as typeof ResizeObserver;
	MutationObserver = FakeMutationObserver as typeof MutationObserver;
	private readonly frames = new Map<number, FrameRequestCallback>();
	private frameId = 0;
	readonly cancelAnimationFrame = vi.fn((handle: number) => {
		this.frames.delete(handle);
	});

	requestAnimationFrame(callback: FrameRequestCallback): number {
		const handle = ++this.frameId;
		this.frames.set(handle, callback);
		return handle;
	}

	flushFrame(handle?: number): void {
		const callback = handle === undefined ? undefined : this.frames.get(handle);
		const entries =
			handle === undefined
				? [...this.frames.entries()]
				: callback === undefined
					? []
					: ([[handle, callback]] as const);

		for (const [frameHandle, callback] of entries) {
			if (callback === undefined) {
				continue;
			}
			this.frames.delete(frameHandle);
			callback(0);
		}
	}

	get pendingFrameCount(): number {
		return this.frames.size;
	}
}

class FakeWindowWithoutObservers extends EventTarget {
	document = document;
	navigator = navigator;
}

class FakeWindowWithoutFrameCancel extends EventTarget {
	document = document;
	navigator = navigator;
	ResizeObserver = FakeResizeObserver as typeof ResizeObserver;
	MutationObserver = FakeMutationObserver as typeof MutationObserver;
	readonly cancelAnimationFrame = undefined;
	private readonly frames = new Map<number, FrameRequestCallback>();
	private frameId = 0;

	requestAnimationFrame(callback: FrameRequestCallback): number {
		const handle = ++this.frameId;
		this.frames.set(handle, callback);
		return handle;
	}

	flushFrame(): void {
		for (const [frameHandle, callback] of [...this.frames.entries()]) {
			this.frames.delete(frameHandle);
			callback(0);
		}
	}

	get pendingFrameCount(): number {
		return this.frames.size;
	}
}

function createRect(values: RectValues): DOMRect {
	return {
		...values,
		toJSON: () => values,
	} as DOMRect;
}

function setRect(element: Element, values: RectValues): void {
	Object.defineProperty(element, "getBoundingClientRect", {
		configurable: true,
		value: () => createRect(values),
	});
}

function expectBounding(
	bounds: ReturnType<typeof useElementBounding>,
	rect: RectValues,
) {
	expect(bounds.bottom.value).toBe(rect.bottom);
	expect(bounds.height.value).toBe(rect.height);
	expect(bounds.left.value).toBe(rect.left);
	expect(bounds.right.value).toBe(rect.right);
	expect(bounds.top.value).toBe(rect.top);
	expect(bounds.width.value).toBe(rect.width);
	expect(bounds.x.value).toBe(rect.x);
	expect(bounds.y.value).toBe(rect.y);
}

const firstRect: RectValues = {
	bottom: 25,
	height: 20,
	left: 10,
	right: 40,
	top: 5,
	width: 30,
	x: 10,
	y: 5,
};

const secondRect: RectValues = {
	bottom: 75,
	height: 50,
	left: 20,
	right: 100,
	top: 25,
	width: 80,
	x: 20,
	y: 25,
};

const emptyRect: RectValues = {
	bottom: 0,
	height: 0,
	left: 0,
	right: 0,
	top: 0,
	width: 0,
	x: 0,
	y: 0,
};

describe("useElementBounding", () => {
	afterEach(() => {
		FakeResizeObserver.instances = [];
		FakeMutationObserver.instances = [];
		document.body.innerHTML = "";
		disposeTrackedMolecules();
	});

	it("reads the initial bounding rectangle and updates manually", () => {
		const element = document.createElement("div");
		const fakeWindow = new FakeWindow();
		setRect(element, firstRect);
		const bounds = useElementBounding(element, { window: fakeWindow });

		expectBounding(bounds, firstRect);

		setRect(element, secondRect);
		bounds.update();
		expectBounding(bounds, secondRect);

		bounds.stop();
	});

	it("updates from ResizeObserver and MutationObserver", () => {
		const element = document.createElement("div");
		const fakeWindow = new FakeWindow();
		setRect(element, firstRect);
		const bounds = useElementBounding(element, { window: fakeWindow });

		expect(FakeResizeObserver.instances[0]?.observed.has(element)).toBe(true);
		expect(FakeMutationObserver.instances[0]?.observed.get(element)).toEqual({
			attributeFilter: ["style", "class"],
			attributes: true,
		});

		setRect(element, secondRect);
		FakeResizeObserver.instances[0]?.emit(element);
		expectBounding(bounds, secondRect);

		setRect(element, firstRect);
		FakeMutationObserver.instances[0]?.emit(element, "class");
		expectBounding(bounds, firstRect);

		bounds.stop();
		setRect(element, secondRect);
		FakeResizeObserver.instances[0]?.emit(element);
		FakeMutationObserver.instances[0]?.emit(element);
		expectBounding(bounds, firstRect);
	});

	it("updates from window scroll and resize events", () => {
		const element = document.createElement("div");
		const fakeWindow = new FakeWindow();
		setRect(element, firstRect);
		const bounds = useElementBounding(element, { window: fakeWindow });

		setRect(element, secondRect);
		fakeWindow.dispatchEvent(new Event("scroll"));
		expectBounding(bounds, secondRect);

		setRect(element, firstRect);
		fakeWindow.dispatchEvent(new Event("resize"));
		expectBounding(bounds, firstRect);

		bounds.stop();
		setRect(element, secondRect);
		fakeWindow.dispatchEvent(new Event("scroll"));
		fakeWindow.dispatchEvent(new Event("resize"));
		expectBounding(bounds, firstRect);
	});

	it("can disable window event updates", () => {
		const element = document.createElement("div");
		const fakeWindow = new FakeWindow();
		setRect(element, firstRect);
		const bounds = useElementBounding(element, {
			window: fakeWindow,
			windowResize: false,
			windowScroll: false,
		});

		setRect(element, secondRect);
		fakeWindow.dispatchEvent(new Event("scroll"));
		fakeWindow.dispatchEvent(new Event("resize"));
		expectBounding(bounds, firstRect);

		bounds.update();
		expectBounding(bounds, secondRect);

		bounds.stop();
	});

	it("can skip the immediate read", () => {
		const element = document.createElement("div");
		const fakeWindow = new FakeWindow();
		setRect(element, firstRect);
		const bounds = useElementBounding(element, {
			immediate: false,
			window: fakeWindow,
		});

		expectBounding(bounds, emptyRect);

		bounds.update();
		expectBounding(bounds, firstRect);

		bounds.stop();
	});

	it("can delay updates until the next animation frame", () => {
		const element = document.createElement("div");
		const fakeWindow = new FakeWindow();
		setRect(element, firstRect);
		const bounds = useElementBounding(element, {
			updateTiming: "next-frame",
			window: fakeWindow,
		});

		expectBounding(bounds, emptyRect);
		expect(fakeWindow.pendingFrameCount).toBe(1);

		fakeWindow.flushFrame();
		expectBounding(bounds, firstRect);

		setRect(element, secondRect);
		bounds.update();
		expectBounding(bounds, firstRect);
		expect(fakeWindow.pendingFrameCount).toBe(1);

		bounds.stop();
		expect(fakeWindow.cancelAnimationFrame).toHaveBeenCalledTimes(1);
		fakeWindow.flushFrame();
		expectBounding(bounds, firstRect);
	});

	it("ignores next-frame callbacks after stop when frame cancel is unavailable", () => {
		const element = document.createElement("div");
		const fakeWindow = new FakeWindowWithoutFrameCancel();
		setRect(element, firstRect);
		const bounds = useElementBounding(element, {
			updateTiming: "next-frame",
			window: fakeWindow,
		});

		expectBounding(bounds, emptyRect);
		expect(fakeWindow.pendingFrameCount).toBe(1);

		bounds.stop();
		setRect(element, secondRect);
		fakeWindow.flushFrame();

		expectBounding(bounds, emptyRect);
	});

	it("ignores manual updates after stop", () => {
		const element = document.createElement("div");
		const fakeWindow = new FakeWindow();
		setRect(element, firstRect);
		const bounds = useElementBounding(element, { window: fakeWindow });

		expectBounding(bounds, firstRect);

		bounds.stop();
		setRect(element, secondRect);
		bounds.update();

		expectBounding(bounds, firstRect);
	});

	it("retargets observers when the element changes", () => {
		const firstElement = document.createElement("div");
		const secondElement = document.createElement("div");
		const target = signal<Element | null>(firstElement);
		const fakeWindow = new FakeWindow();
		setRect(firstElement, firstRect);
		setRect(secondElement, secondRect);
		const bounds = useElementBounding(target, { window: fakeWindow });
		const firstObserver = FakeResizeObserver.instances[0];

		expectBounding(bounds, firstRect);

		target.value = secondElement;
		const secondObserver = FakeResizeObserver.instances[1];
		expectBounding(bounds, secondRect);

		setRect(firstElement, {
			...firstRect,
			width: 200,
		});
		firstObserver?.emit(firstElement);
		expectBounding(bounds, secondRect);

		setRect(secondElement, firstRect);
		secondObserver?.emit(secondElement);
		expectBounding(bounds, firstRect);

		target.value = null;
		expectBounding(bounds, emptyRect);

		bounds.stop();
	});

	it("can keep the last values when the target disappears", () => {
		const element = document.createElement("div");
		const target = signal<Element | null>(element);
		const fakeWindow = new FakeWindow();
		setRect(element, firstRect);
		const bounds = useElementBounding(target, {
			reset: false,
			window: fakeWindow,
		});

		target.value = null;
		expectBounding(bounds, firstRect);

		bounds.stop();
	});

	it("works without observer support", () => {
		const element = document.createElement("div");
		const fakeWindow = new FakeWindowWithoutObservers();
		setRect(element, firstRect);
		const bounds = useElementBounding(element, { window: fakeWindow });

		expectBounding(bounds, firstRect);
		expect(FakeResizeObserver.instances).toHaveLength(0);
		expect(FakeMutationObserver.instances).toHaveLength(0);

		setRect(element, secondRect);
		bounds.update();
		expectBounding(bounds, secondRect);

		bounds.stop();
	});

	it("does not use the default window when window is null", () => {
		const element = document.createElement("div");
		const resizeObserver = globalThis.ResizeObserver;
		const mutationObserver = globalThis.MutationObserver;
		const addEventListenerSpy = vi.spyOn(window, "addEventListener");
		Object.defineProperty(globalThis, "ResizeObserver", {
			configurable: true,
			value: FakeResizeObserver,
		});
		Object.defineProperty(globalThis, "MutationObserver", {
			configurable: true,
			value: FakeMutationObserver,
		});

		try {
			setRect(element, firstRect);
			const bounds = useElementBounding(element, { window: null });

			expectBounding(bounds, firstRect);
			expect(FakeResizeObserver.instances).toHaveLength(0);
			expect(FakeMutationObserver.instances).toHaveLength(0);
			expect(addEventListenerSpy).not.toHaveBeenCalled();

			bounds.stop();
		} finally {
			addEventListenerSpy.mockRestore();
			Object.defineProperty(globalThis, "ResizeObserver", {
				configurable: true,
				value: resizeObserver,
			});
			Object.defineProperty(globalThis, "MutationObserver", {
				configurable: true,
				value: mutationObserver,
			});
		}
	});
});
