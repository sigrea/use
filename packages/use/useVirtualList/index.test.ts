import { createScope, disposeScope, runWithScope, signal } from "@sigrea/core";
import { afterEach, describe, expect, it } from "vitest";

import type { ResizeObserverWindowLike } from "../types";
import { useVirtualList } from "./index";

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

	emit(target: Element): void {
		if (!this.observed.has(target)) {
			return;
		}

		this.callback(
			[
				{
					target,
					contentRect: {
						width: target.clientWidth,
						height: target.clientHeight,
					} as DOMRectReadOnly,
					contentBoxSize: [
						{
							inlineSize: target.clientWidth,
							blockSize: target.clientHeight,
						},
					],
					borderBoxSize: [],
					devicePixelContentBoxSize: [],
				} as ResizeObserverEntry,
			],
			this,
		);
	}
}

class FakeWindow extends EventTarget implements ResizeObserverWindowLike {
	readonly document = document;
	readonly navigator = navigator;
	readonly ResizeObserver = FakeResizeObserver as typeof ResizeObserver;
}

function createItems(count: number): readonly string[] {
	return Array.from({ length: count }, (_, index) => `item-${index}`);
}

function createContainer(width: number, height: number): HTMLElement {
	const element = document.createElement("div");
	Object.defineProperties(element, {
		clientWidth: { configurable: true, value: width },
		clientHeight: { configurable: true, value: height },
		offsetWidth: { configurable: true, value: width },
		offsetHeight: { configurable: true, value: height },
		scrollLeft: { configurable: true, value: 0, writable: true },
		scrollTop: { configurable: true, value: 0, writable: true },
	});

	return element;
}

function setClientSize(
	element: HTMLElement,
	width: number,
	height: number,
): void {
	Object.defineProperties(element, {
		clientWidth: { configurable: true, value: width },
		clientHeight: { configurable: true, value: height },
		offsetWidth: { configurable: true, value: width },
		offsetHeight: { configurable: true, value: height },
	});
}

function dataOf<T>(items: readonly { readonly data: T }[]): T[] {
	return items.map((item) => item.data);
}

function indicesOf(items: readonly { readonly index: number }[]): number[] {
	return items.map((item) => item.index);
}

describe("useVirtualList", () => {
	afterEach(() => {
		FakeResizeObserver.instances = [];
		document.body.innerHTML = "";
	});

	it("calculates a vertical fixed-size range with default and custom overscan", () => {
		const items = createItems(20);
		const defaultVirtual = useVirtualList(items, { itemHeight: 10 });
		const defaultContainer = createContainer(100, 30);

		defaultVirtual.containerRef.value = defaultContainer;
		expect(defaultVirtual.containerStyle).toBe("overflow-y: auto;");
		expect(indicesOf(defaultVirtual.list.value)).toEqual([
			0, 1, 2, 3, 4, 5, 6, 7,
		]);
		expect(defaultVirtual.wrapperStyle.value).toBe(
			"width: 100%; height: 200px; margin-top: 0px;",
		);

		defaultVirtual.scrollTo(10);
		expect(defaultContainer.scrollTop).toBe(100);
		expect(indicesOf(defaultVirtual.list.value)).toEqual([
			5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17,
		]);
		expect(defaultVirtual.wrapperStyle.value).toBe(
			"width: 100%; height: 150px; margin-top: 50px;",
		);

		const customVirtual = useVirtualList(items, {
			itemHeight: 10,
			overscan: 1,
		});
		const customContainer = createContainer(100, 30);
		customVirtual.containerRef.value = customContainer;
		customContainer.scrollTop = 50;
		customVirtual.onScroll();

		expect(indicesOf(customVirtual.list.value)).toEqual([4, 5, 6, 7, 8]);
	});

	it("clamps overscan and scroll target indices", () => {
		const virtual = useVirtualList(createItems(5), {
			itemHeight: 10,
			overscan: -10,
		});
		const container = createContainer(100, 20);

		virtual.containerRef.value = container;
		expect(indicesOf(virtual.list.value)).toEqual([0, 1]);

		virtual.scrollTo(99);
		expect(container.scrollTop).toBe(40);
		expect(indicesOf(virtual.list.value)).toEqual([4]);
	});

	it("includes trailing items that are partially visible after non-boundary scroll positions", () => {
		const vertical = useVirtualList(createItems(10), {
			itemHeight: 10,
			overscan: 0,
		});
		const verticalContainer = createContainer(100, 30);
		vertical.containerRef.value = verticalContainer;
		verticalContainer.scrollTop = 5;
		vertical.onScroll();

		expect(indicesOf(vertical.list.value)).toEqual([0, 1, 2, 3]);

		const horizontal = useVirtualList(createItems(10), {
			itemWidth: 10,
			overscan: 0,
		});
		const horizontalContainer = createContainer(30, 100);
		horizontal.containerRef.value = horizontalContainer;
		horizontalContainer.scrollLeft = 5;
		horizontal.onScroll();

		expect(indicesOf(horizontal.list.value)).toEqual([0, 1, 2, 3]);

		const variable = useVirtualList(["a", "b", "c", "d"], {
			itemHeight: (index) => [6, 10, 10, 10][index] ?? 0,
			overscan: 0,
		});
		const variableContainer = createContainer(100, 12);
		variable.containerRef.value = variableContainer;
		variableContainer.scrollTop = 5;
		variable.onScroll();

		expect(dataOf(variable.list.value)).toEqual(["a", "b", "c"]);
	});

	it("calculates a horizontal fixed-size range", () => {
		const virtual = useVirtualList(createItems(10), {
			itemWidth: 20,
			overscan: 1,
		});
		const container = createContainer(60, 100);

		virtual.containerRef.value = container;
		virtual.scrollTo(5);

		expect(virtual.containerStyle).toBe("overflow-x: auto;");
		expect(container.scrollLeft).toBe(100);
		expect(indicesOf(virtual.list.value)).toEqual([4, 5, 6, 7, 8]);
		expect(virtual.wrapperStyle.value).toBe(
			"height: 100%; width: 120px; margin-left: 80px; display: flex;",
		);
	});

	it("supports variable item sizes", () => {
		const virtual = useVirtualList(["a", "b", "c", "d", "e"], {
			itemHeight: (index) => [10, 20, 30, 40, 50][index] ?? 0,
			overscan: 0,
		});
		const container = createContainer(100, 25);

		virtual.containerRef.value = container;
		expect(dataOf(virtual.list.value)).toEqual(["a", "b"]);
		expect(virtual.wrapperStyle.value).toBe(
			"width: 100%; height: 150px; margin-top: 0px;",
		);

		virtual.scrollTo(2);
		expect(container.scrollTop).toBe(30);
		expect(dataOf(virtual.list.value)).toEqual(["c"]);
		expect(virtual.wrapperStyle.value).toBe(
			"width: 100%; height: 120px; margin-top: 30px;",
		);
	});

	it("accepts plain arrays, readonly arrays, signals, and getter sources", () => {
		const plain = useVirtualList(["a", "b", "c"], {
			itemHeight: 10,
			overscan: 0,
		});
		const readonlySource = ["a", "b", "c"] as const;
		const readonlyVirtual = useVirtualList(readonlySource, {
			itemHeight: 10,
			overscan: 0,
		});
		const source = signal<readonly string[]>(["a", "b"]);
		const signalVirtual = useVirtualList(source, {
			itemHeight: 10,
			overscan: 0,
		});
		const getterVirtual = useVirtualList(() => source.value, {
			itemHeight: 10,
			overscan: 0,
		});

		for (const virtual of [
			plain,
			readonlyVirtual,
			signalVirtual,
			getterVirtual,
		]) {
			virtual.containerRef.value = createContainer(100, 30);
		}

		expect(dataOf(plain.list.value)).toEqual(["a", "b", "c"]);
		expect(dataOf(readonlyVirtual.list.value)).toEqual(["a", "b", "c"]);
		expect(dataOf(signalVirtual.list.value)).toEqual(["a", "b"]);
		expect(dataOf(getterVirtual.list.value)).toEqual(["a", "b"]);

		source.value = ["c", "d", "e"];

		expect(dataOf(signalVirtual.list.value)).toEqual(["c", "d", "e"]);
		expect(dataOf(getterVirtual.list.value)).toEqual(["c", "d", "e"]);
	});

	it("retargets scroll listeners when the container changes", () => {
		const virtual = useVirtualList(createItems(10), {
			itemHeight: 10,
			overscan: 0,
		});
		const first = createContainer(100, 20);
		const second = createContainer(100, 20);

		virtual.containerRef.value = first;
		expect(indicesOf(virtual.list.value)).toEqual([0, 1]);

		virtual.containerRef.value = second;
		first.scrollTop = 50;
		first.dispatchEvent(new Event("scroll"));
		expect(indicesOf(virtual.list.value)).toEqual([0, 1]);

		second.scrollTop = 50;
		second.dispatchEvent(new Event("scroll"));
		expect(indicesOf(virtual.list.value)).toEqual([5, 6]);
	});

	it("recalculates when ResizeObserver reports a new size", () => {
		const fakeWindow = new FakeWindow();
		const virtual = useVirtualList(createItems(10), {
			itemHeight: 10,
			overscan: 0,
			window: fakeWindow,
		});
		const container = createContainer(100, 20);

		virtual.containerRef.value = container;
		expect(indicesOf(virtual.list.value)).toEqual([0, 1]);

		setClientSize(container, 100, 50);
		FakeResizeObserver.instances[0]?.emit(container);

		expect(indicesOf(virtual.list.value)).toEqual([0, 1, 2, 3, 4]);
	});

	it("stops scroll, list, and resize updates", () => {
		const fakeWindow = new FakeWindow();
		const source = signal<readonly string[]>(createItems(10));
		const virtual = useVirtualList(source, {
			itemHeight: 10,
			overscan: 0,
			window: fakeWindow,
		});
		const container = createContainer(100, 20);

		virtual.containerRef.value = container;
		expect(indicesOf(virtual.list.value)).toEqual([0, 1]);

		virtual.stop();
		source.value = createItems(20);
		container.scrollTop = 50;
		container.dispatchEvent(new Event("scroll"));
		setClientSize(container, 100, 50);
		FakeResizeObserver.instances[0]?.emit(container);
		virtual.measure();

		expect(indicesOf(virtual.list.value)).toEqual([0, 1]);
	});

	it("stops on scope disposal", () => {
		const scope = createScope();
		const virtual = runWithScope(scope, () =>
			useVirtualList(createItems(10), {
				itemHeight: 10,
				overscan: 0,
			}),
		);
		const container = createContainer(100, 20);
		virtual.containerRef.value = container;

		disposeScope(scope);
		container.scrollTop = 50;
		container.dispatchEvent(new Event("scroll"));

		expect(indicesOf(virtual.list.value)).toEqual([0, 1]);
	});

	it("is safe without a container", () => {
		const virtual = useVirtualList(createItems(10), {
			itemHeight: 10,
			overscan: 0,
			window: null,
		});

		expect(virtual.list.value).toEqual([]);
		expect(virtual.wrapperStyle.value).toBe(
			"width: 100%; height: 100px; margin-top: 0px;",
		);
		virtual.measure();
		virtual.onScroll(new Event("scroll"));
		virtual.scrollTo(2);
		virtual.stop();
	});
});
