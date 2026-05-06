import { disposeTrackedMolecules } from "@sigrea/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { UseInfiniteScrollWindowLike } from "../types";
import { useInfiniteScroll } from "./index";

class FakeIntersectionObserver implements IntersectionObserver {
	static instances: FakeIntersectionObserver[] = [];

	readonly root: Element | Document | null;
	readonly rootMargin: string;
	readonly thresholds: readonly number[];
	readonly observed = new Set<Element>();

	constructor(
		private readonly callback: IntersectionObserverCallback,
		readonly options: IntersectionObserverInit = {},
	) {
		this.root = options.root ?? null;
		this.rootMargin = options.rootMargin ?? "0px";
		const threshold = options.threshold ?? 0;
		this.thresholds = Array.isArray(threshold) ? threshold : [threshold];
		FakeIntersectionObserver.instances.push(this);
	}

	disconnect(): void {
		this.observed.clear();
	}

	observe(target: Element): void {
		this.observed.add(target);
	}

	takeRecords(): IntersectionObserverEntry[] {
		return [];
	}

	unobserve(target: Element): void {
		this.observed.delete(target);
	}

	emit(target: Element, isIntersecting: boolean): void {
		if (!this.observed.has(target)) {
			return;
		}

		this.callback(
			[
				{
					boundingClientRect: {} as DOMRectReadOnly,
					intersectionRatio: isIntersecting ? 1 : 0,
					intersectionRect: {} as DOMRectReadOnly,
					isIntersecting,
					rootBounds: null,
					target,
					time: Date.now(),
				} as IntersectionObserverEntry,
			],
			this,
		);
	}
}

class FakeWindow extends EventTarget implements UseInfiniteScrollWindowLike {
	readonly document = document;
	readonly navigator = navigator;
	readonly IntersectionObserver =
		FakeIntersectionObserver as typeof IntersectionObserver;

	getComputedStyle(element: Element): CSSStyleDeclaration {
		return (element as HTMLElement).dataset as unknown as Pick<
			CSSStyleDeclaration,
			"direction" | "display" | "flexDirection"
		> as CSSStyleDeclaration;
	}
}

interface ScrollMetrics {
	clientHeight?: number;
	clientWidth?: number;
	scrollHeight?: number;
	scrollLeft?: number;
	scrollTop?: number;
	scrollWidth?: number;
}

function createScrollElement(metrics: ScrollMetrics = {}): HTMLElement {
	const element = document.createElement("div");
	setMetrics(element, metrics);
	document.body.append(element);

	return element;
}

function setMetrics(element: HTMLElement, metrics: ScrollMetrics): void {
	for (const [key, value] of Object.entries(metrics)) {
		Object.defineProperty(element, key, {
			configurable: true,
			value,
			writable: true,
		});
	}
}

function latestObserver(): FakeIntersectionObserver {
	const observer = FakeIntersectionObserver.instances.at(-1);
	if (observer === undefined) {
		throw new Error("IntersectionObserver was not created");
	}

	return observer;
}

async function flushAsync(): Promise<void> {
	await Promise.resolve();
	await vi.runOnlyPendingTimersAsync();
	await Promise.resolve();
	await Promise.resolve();
	await Promise.resolve();
}

describe("useInfiniteScroll", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		FakeIntersectionObserver.instances = [];
		document.body.innerHTML = "";
		disposeTrackedMolecules();
		vi.useRealTimers();
		vi.unstubAllGlobals();
	});

	it("loads when the visible target reaches the configured distance", async () => {
		const element = createScrollElement({
			clientHeight: 100,
			clientWidth: 100,
			scrollHeight: 200,
			scrollTop: 84,
			scrollWidth: 100,
		});
		let loaded = false;
		const onLoadMore = vi.fn(() => {
			loaded = true;
		});
		const infinite = useInfiniteScroll(element, onLoadMore, {
			canLoadMore: () => !loaded,
			distance: 16,
			interval: 0,
			window: new FakeWindow(),
		});

		expect(onLoadMore).not.toHaveBeenCalled();

		latestObserver().emit(element, true);
		await flushAsync();

		expect(onLoadMore).toHaveBeenCalledTimes(1);
		expect(infinite.isLoading.value).toBe(false);
		expect(infinite.error.value).toBeUndefined();

		infinite.stop();
	});

	it("passes measured scroll state to the loader", async () => {
		const element = createScrollElement({
			clientHeight: 100,
			clientWidth: 50,
			scrollHeight: 200,
			scrollTop: 100,
			scrollWidth: 150,
		});
		const onLoadMore = vi.fn();
		let loaded = false;
		const infinite = useInfiniteScroll(
			element,
			(state) => {
				loaded = true;
				onLoadMore({
					arrivedState: state.arrivedState.value,
					directions: state.directions.value,
					x: state.x.value,
					y: state.y.value,
				});
			},
			{ canLoadMore: () => !loaded, interval: 0, window: new FakeWindow() },
		);

		latestObserver().emit(element, true);
		await flushAsync();

		expect(onLoadMore).toHaveBeenCalledWith({
			arrivedState: {
				bottom: true,
				left: true,
				right: false,
				top: false,
			},
			directions: {
				bottom: false,
				left: false,
				right: false,
				top: false,
			},
			x: 0,
			y: 100,
		});

		infinite.stop();
	});

	it("does not start another load while one is pending", async () => {
		const element = createScrollElement({
			clientHeight: 100,
			scrollHeight: 200,
			scrollTop: 100,
		});
		let resolveLoad!: () => void;
		const pendingLoad = new Promise<void>((resolve) => {
			resolveLoad = resolve;
		});
		const onLoadMore = vi.fn(() => pendingLoad);
		const infinite = useInfiniteScroll(element, onLoadMore, {
			canLoadMore: () => onLoadMore.mock.calls.length === 0,
			interval: 0,
			window: new FakeWindow(),
		});

		latestObserver().emit(element, true);
		await Promise.resolve();
		element.dispatchEvent(new Event("scroll"));
		element.dispatchEvent(new Event("scroll"));

		expect(onLoadMore).toHaveBeenCalledTimes(1);
		expect(infinite.isLoading.value).toBe(true);

		resolveLoad();
		await flushAsync();

		expect(infinite.isLoading.value).toBe(false);
		infinite.stop();
	});

	it("keeps loading short content until canLoadMore returns false", async () => {
		const element = createScrollElement({
			clientHeight: 100,
			scrollHeight: 80,
		});
		let loaded = 0;
		const infinite = useInfiniteScroll(
			element,
			() => {
				loaded += 1;
			},
			{
				canLoadMore: () => loaded < 2,
				interval: 0,
				window: new FakeWindow(),
			},
		);

		latestObserver().emit(element, true);
		await flushAsync();
		await flushAsync();

		expect(loaded).toBe(2);
		infinite.stop();
	});

	it("supports top and right directions", async () => {
		const topElement = createScrollElement({
			clientHeight: 100,
			scrollHeight: 200,
			scrollTop: 100,
		});
		const rightElement = createScrollElement({
			clientWidth: 100,
			scrollLeft: 100,
			scrollWidth: 200,
		});
		topElement.dataset.display = "flex";
		topElement.dataset.flexDirection = "column-reverse";
		rightElement.dataset.display = "flex";
		const topLoad = vi.fn();
		const rightLoad = vi.fn();
		const window = new FakeWindow();
		const top = useInfiniteScroll(topElement, topLoad, {
			canLoadMore: () => topLoad.mock.calls.length === 0,
			direction: "top",
			interval: 0,
			window,
		});
		const right = useInfiniteScroll(rightElement, rightLoad, {
			canLoadMore: () => rightLoad.mock.calls.length === 0,
			direction: "right",
			interval: 0,
			window,
		});

		FakeIntersectionObserver.instances[0]?.emit(topElement, true);
		FakeIntersectionObserver.instances[1]?.emit(rightElement, true);
		await flushAsync();

		expect(topLoad).toHaveBeenCalledTimes(1);
		expect(rightLoad).toHaveBeenCalledTimes(1);

		top.stop();
		right.stop();
	});

	it("measures document targets through documentElement", async () => {
		const documentElement = document.documentElement;
		setMetrics(documentElement, {
			clientHeight: 100,
			scrollHeight: 200,
			scrollTop: 100,
		});
		const onLoadMore = vi.fn();
		const infinite = useInfiniteScroll(document, onLoadMore, {
			canLoadMore: () => onLoadMore.mock.calls.length === 0,
			interval: 0,
			window: new FakeWindow(),
		});

		latestObserver().emit(documentElement, true);
		await flushAsync();

		expect(onLoadMore).toHaveBeenCalledTimes(1);

		infinite.stop();
	});

	it("passes the resolved element to canLoadMore for document targets", async () => {
		const documentElement = document.documentElement;
		setMetrics(documentElement, {
			clientHeight: 100,
			scrollHeight: 200,
			scrollTop: 100,
		});
		const canLoadMore = vi.fn(() => true);
		const onLoadMore = vi.fn();
		const infinite = useInfiniteScroll(document, onLoadMore, {
			canLoadMore,
			interval: 0,
			window: new FakeWindow(),
		});

		latestObserver().emit(documentElement, true);
		await flushAsync();

		expect(canLoadMore).toHaveBeenCalledWith(documentElement);
		expect(canLoadMore).not.toHaveBeenCalledWith(document);
		expect(onLoadMore).toHaveBeenCalled();

		infinite.stop();
	});

	it("runs a trailing scroll check when throttle is enabled", async () => {
		const element = createScrollElement({
			clientHeight: 100,
			scrollHeight: 300,
			scrollTop: 0,
		});
		let loaded = false;
		const onLoadMore = vi.fn(() => {
			loaded = true;
		});
		const infinite = useInfiniteScroll(element, onLoadMore, {
			canLoadMore: () => !loaded,
			interval: 0,
			throttle: 100,
			window: new FakeWindow(),
		});

		latestObserver().emit(element, true);
		element.dispatchEvent(new Event("scroll"));
		element.scrollTop = 200;
		element.dispatchEvent(new Event("scroll"));

		expect(onLoadMore).not.toHaveBeenCalled();

		await vi.advanceTimersByTimeAsync(100);
		await flushAsync();

		expect(onLoadMore).toHaveBeenCalledTimes(1);

		infinite.stop();
	});

	it("records load errors without leaving loading active", async () => {
		const element = createScrollElement({
			clientHeight: 100,
			scrollHeight: 200,
			scrollTop: 100,
		});
		const failure = new Error("load failed");
		const onError = vi.fn();
		let tried = false;
		const infinite = useInfiniteScroll(
			element,
			() => {
				tried = true;
				return Promise.reject(failure);
			},
			{
				canLoadMore: () => !tried,
				interval: 0,
				onError,
				window: new FakeWindow(),
			},
		);

		latestObserver().emit(element, true);
		await flushAsync();

		expect(infinite.error.value).toBe(failure);
		expect(infinite.isLoading.value).toBe(false);
		expect(onError).toHaveBeenCalledWith(failure);

		infinite.stop();
	});

	it("does not use the global IntersectionObserver when window is null", async () => {
		const element = createScrollElement({
			clientHeight: 100,
			scrollHeight: 200,
			scrollTop: 100,
		});
		const onLoadMore = vi.fn();
		vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
		const infinite = useInfiniteScroll(element, onLoadMore, {
			interval: 0,
			window: null,
		});

		element.dispatchEvent(new Event("scroll"));
		await flushAsync();

		expect(FakeIntersectionObserver.instances).toHaveLength(0);
		expect(onLoadMore).not.toHaveBeenCalled();
		expect(infinite.isLoading.value).toBe(false);

		infinite.stop();
	});

	it("stops listeners and visibility tracking", async () => {
		const element = createScrollElement({
			clientHeight: 100,
			scrollHeight: 200,
			scrollTop: 100,
		});
		const onLoadMore = vi.fn();
		const infinite = useInfiniteScroll(element, onLoadMore, {
			interval: 0,
			window: new FakeWindow(),
		});
		const observer = latestObserver();

		infinite.stop();
		observer.emit(element, true);
		element.dispatchEvent(new Event("scroll"));
		await flushAsync();

		expect(onLoadMore).not.toHaveBeenCalled();
		expect(observer.observed.size).toBe(0);
	});
});
