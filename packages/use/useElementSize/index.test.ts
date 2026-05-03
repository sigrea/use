import { disposeTrackedMolecules, signal } from "@sigrea/core";
import { afterEach, describe, expect, it } from "vitest";

import { useElementSize } from "./index";

class FakeResizeObserver implements ResizeObserver {
	static instances: FakeResizeObserver[] = [];

	readonly observed = new Map<Element, ResizeObserverOptions | undefined>();

	constructor(private readonly callback: ResizeObserverCallback) {
		FakeResizeObserver.instances.push(this);
	}

	observe(target: Element, options?: ResizeObserverOptions) {
		this.observed.set(target, options);
	}

	unobserve(target: Element) {
		this.observed.delete(target);
	}

	disconnect() {
		this.observed.clear();
	}

	emit(entry: ResizeObserverEntry) {
		if (!this.observed.has(entry.target)) {
			return;
		}

		this.callback([entry], this);
	}
}

class FakeWindow extends EventTarget {
	document = document;
	navigator = navigator;
	ResizeObserver = FakeResizeObserver as typeof ResizeObserver;
}

class FakeWindowWithoutResizeObserver extends EventTarget {
	document = document;
	navigator = navigator;
}

function setOffsetSize(element: Element, width: number, height: number): void {
	Object.defineProperties(element, {
		offsetWidth: { configurable: true, value: width },
		offsetHeight: { configurable: true, value: height },
	});
}

function boxSize(
	inlineSize: number,
	blockSize: number,
): readonly ResizeObserverSize[] {
	return [{ inlineSize, blockSize }];
}

function entry(
	target: Element,
	options: {
		contentRect?: { width: number; height: number };
		contentBoxSize?: readonly ResizeObserverSize[];
		borderBoxSize?: readonly ResizeObserverSize[];
		devicePixelContentBoxSize?: readonly ResizeObserverSize[];
	},
): ResizeObserverEntry {
	return {
		target,
		contentRect: {
			width: options.contentRect?.width ?? 0,
			height: options.contentRect?.height ?? 0,
		} as DOMRectReadOnly,
		contentBoxSize: options.contentBoxSize ?? [],
		borderBoxSize: options.borderBoxSize ?? [],
		devicePixelContentBoxSize: options.devicePixelContentBoxSize ?? [],
	} as ResizeObserverEntry;
}

describe("useElementSize", () => {
	afterEach(() => {
		FakeResizeObserver.instances = [];
		document.body.innerHTML = "";
		disposeTrackedMolecules();
	});

	it("tracks content-box size and stops observing", () => {
		const element = document.createElement("div");
		setOffsetSize(element, 12, 6);
		const fakeWindow = new FakeWindow();
		const size = useElementSize(
			element,
			{ width: 1, height: 2 },
			{ window: fakeWindow },
		);
		const observer = FakeResizeObserver.instances[0];

		expect(size.width.value).toBe(12);
		expect(size.height.value).toBe(6);
		expect(observer?.observed.get(element)).toEqual({ box: "content-box" });

		observer?.emit(
			entry(element, {
				contentBoxSize: boxSize(100, 50),
				contentRect: { width: 10, height: 5 },
			}),
		);
		expect(size.width.value).toBe(100);
		expect(size.height.value).toBe(50);

		size.stop();
		observer?.emit(
			entry(element, {
				contentBoxSize: boxSize(200, 150),
			}),
		);
		expect(size.width.value).toBe(100);
		expect(size.height.value).toBe(50);
	});

	it("uses initial offset size when ResizeObserver is unavailable", () => {
		const element = document.createElement("div");
		setOffsetSize(element, 21, 13);
		const fakeWindow = new FakeWindowWithoutResizeObserver();
		const size = useElementSize(
			element,
			{ width: 1, height: 2 },
			{ window: fakeWindow },
		);

		expect(size.width.value).toBe(21);
		expect(size.height.value).toBe(13);
		expect(FakeResizeObserver.instances).toHaveLength(0);

		size.stop();
	});

	it("does not use the global ResizeObserver when window is null", () => {
		const originalResizeObserver = globalThis.ResizeObserver;
		Object.defineProperty(globalThis, "ResizeObserver", {
			configurable: true,
			value: FakeResizeObserver,
		});
		try {
			const element = document.createElement("div");
			setOffsetSize(element, 21, 13);
			const size = useElementSize(
				element,
				{ width: 1, height: 2 },
				{ window: null },
			);

			expect(size.width.value).toBe(21);
			expect(size.height.value).toBe(13);
			expect(FakeResizeObserver.instances).toHaveLength(0);

			size.stop();
		} finally {
			Object.defineProperty(globalThis, "ResizeObserver", {
				configurable: true,
				value: originalResizeObserver,
			});
		}
	});

	it("can read border-box size", () => {
		const element = document.createElement("div");
		const fakeWindow = new FakeWindow();
		const size = useElementSize(
			element,
			{ width: 0, height: 0 },
			{
				box: "border-box",
				window: fakeWindow,
			},
		);

		FakeResizeObserver.instances[0]?.emit(
			entry(element, {
				contentBoxSize: boxSize(100, 50),
				borderBoxSize: boxSize(120, 70),
			}),
		);

		expect(size.width.value).toBe(120);
		expect(size.height.value).toBe(70);

		size.stop();
	});

	it("falls back to contentRect when box sizes are unavailable", () => {
		const element = document.createElement("div");
		const fakeWindow = new FakeWindow();
		const size = useElementSize(
			element,
			{ width: 0, height: 0 },
			{
				window: fakeWindow,
			},
		);

		FakeResizeObserver.instances[0]?.emit(
			entry(element, {
				contentRect: { width: 80, height: 40 },
			}),
		);

		expect(size.width.value).toBe(80);
		expect(size.height.value).toBe(40);

		size.stop();
	});

	it("uses getBoundingClientRect for SVG elements", () => {
		const element = document.createElementNS(
			"http://www.w3.org/2000/svg",
			"svg",
		);
		const fakeWindow = new FakeWindow();
		element.getBoundingClientRect = () =>
			({
				width: 32,
				height: 24,
			}) as DOMRect;
		const size = useElementSize(
			element,
			{ width: 0, height: 0 },
			{
				window: fakeWindow,
			},
		);

		FakeResizeObserver.instances[0]?.emit(
			entry(element, {
				contentBoxSize: boxSize(100, 50),
			}),
		);

		expect(size.width.value).toBe(32);
		expect(size.height.value).toBe(24);

		size.stop();
	});

	it("retargets ResizeObserver when the element changes", () => {
		const firstElement = document.createElement("div");
		const secondElement = document.createElement("div");
		setOffsetSize(firstElement, 4, 5);
		setOffsetSize(secondElement, 6, 7);
		const target = signal<Element | null>(firstElement);
		const fakeWindow = new FakeWindow();
		const size = useElementSize(
			target,
			{ width: 4, height: 5 },
			{
				window: fakeWindow,
			},
		);
		const firstObserver = FakeResizeObserver.instances[0];

		firstObserver?.emit(
			entry(firstElement, {
				contentBoxSize: boxSize(20, 30),
			}),
		);
		expect(size.width.value).toBe(20);
		expect(size.height.value).toBe(30);

		target.value = secondElement;
		const secondObserver = FakeResizeObserver.instances[1];
		expect(size.width.value).toBe(6);
		expect(size.height.value).toBe(7);

		firstObserver?.emit(
			entry(firstElement, {
				contentBoxSize: boxSize(100, 200),
			}),
		);
		expect(size.width.value).toBe(6);
		expect(size.height.value).toBe(7);

		secondObserver?.emit(
			entry(secondElement, {
				contentBoxSize: boxSize(40, 50),
			}),
		);
		expect(size.width.value).toBe(40);
		expect(size.height.value).toBe(50);

		target.value = null;
		expect(size.width.value).toBe(0);
		expect(size.height.value).toBe(0);

		size.stop();
	});
});
