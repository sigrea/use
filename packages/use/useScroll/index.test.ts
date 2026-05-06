import { disposeTrackedMolecules, signal } from "@sigrea/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { UseScrollWindowLike } from "../types";
import { useScroll } from "./index";

class FakeMutationObserver implements MutationObserver {
	static instances: FakeMutationObserver[] = [];

	readonly targets: Array<{ options?: MutationObserverInit; target: Node }> =
		[];

	constructor(private readonly callback: MutationCallback) {
		FakeMutationObserver.instances.push(this);
	}

	disconnect(): void {
		this.targets.length = 0;
	}

	observe(target: Node, options?: MutationObserverInit): void {
		this.targets.push({ options, target });
	}

	takeRecords(): MutationRecord[] {
		return [];
	}

	emit(target = this.targets[0]?.target): void {
		if (target === undefined) {
			return;
		}

		this.callback([{ target } as MutationRecord], this);
	}
}

class FakeWindow extends EventTarget implements UseScrollWindowLike {
	readonly MutationObserver = FakeMutationObserver as typeof MutationObserver;
	readonly navigator = navigator;

	constructor(readonly document: Document = globalThis.document) {
		super();
	}

	getComputedStyle(element: Element): CSSStyleDeclaration {
		return (element as HTMLElement).dataset as unknown as Pick<
			CSSStyleDeclaration,
			"direction" | "display" | "flexDirection"
		> as CSSStyleDeclaration;
	}

	scrollTo(options: ScrollToOptions = {}): void {
		const element = this.document.documentElement;
		element.scrollLeft = options.left ?? element.scrollLeft;
		element.scrollTop = options.top ?? element.scrollTop;
		this.dispatchEvent(new Event("scroll"));
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

function setMetrics(element: HTMLElement, metrics: ScrollMetrics): void {
	for (const [key, value] of Object.entries(metrics)) {
		Object.defineProperty(element, key, {
			configurable: true,
			value,
			writable: true,
		});
	}
}

function createScrollElement(metrics: ScrollMetrics = {}): HTMLElement {
	const element = document.createElement("div");
	setMetrics(element, {
		clientHeight: 100,
		clientWidth: 100,
		scrollHeight: 200,
		scrollLeft: 0,
		scrollTop: 0,
		scrollWidth: 200,
		...metrics,
	});
	document.body.append(element);

	return element;
}

describe("useScroll", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		FakeMutationObserver.instances = [];
		document.body.innerHTML = "";
		disposeTrackedMolecules();
		vi.useRealTimers();
		vi.unstubAllGlobals();
	});

	it("measures the initial element scroll state", () => {
		const element = createScrollElement({
			scrollLeft: 30,
			scrollTop: 40,
		});
		const scroll = useScroll(element, { window: new FakeWindow() });

		expect(scroll.x.value).toBe(30);
		expect(scroll.y.value).toBe(40);
		expect(scroll.arrivedState.value).toEqual({
			bottom: false,
			left: false,
			right: false,
			top: false,
		});
		expect(scroll.directions.value).toEqual({
			bottom: true,
			left: false,
			right: true,
			top: false,
		});

		scroll.stop();
	});

	it("updates directions and scrolling state from scroll and scrollend events", () => {
		const element = createScrollElement();
		const onScroll = vi.fn();
		const onStop = vi.fn();
		const scroll = useScroll(element, {
			idle: 100,
			onScroll,
			onStop,
			window: new FakeWindow(),
		});

		element.scrollTop = 90;
		element.dispatchEvent(new Event("scroll"));

		expect(scroll.y.value).toBe(90);
		expect(scroll.isScrolling.value).toBe(true);
		expect(scroll.directions.value.bottom).toBe(true);
		expect(onScroll).toHaveBeenCalledTimes(1);

		element.dispatchEvent(new Event("scrollend"));

		expect(scroll.isScrolling.value).toBe(false);
		expect(scroll.directions.value).toEqual({
			bottom: false,
			left: false,
			right: false,
			top: false,
		});
		expect(onStop).toHaveBeenCalledTimes(1);

		vi.advanceTimersByTime(100);
		expect(onStop).toHaveBeenCalledTimes(1);
	});

	it("falls back to idle timers when scrollend is not dispatched", () => {
		const element = createScrollElement();
		const onStop = vi.fn();
		const scroll = useScroll(element, {
			idle: 80,
			onStop,
			window: new FakeWindow(),
		});

		element.scrollTop = 100;
		element.dispatchEvent(new Event("scroll"));

		expect(scroll.isScrolling.value).toBe(true);

		vi.advanceTimersByTime(79);
		expect(scroll.isScrolling.value).toBe(true);
		expect(onStop).not.toHaveBeenCalled();

		vi.advanceTimersByTime(1);
		expect(scroll.isScrolling.value).toBe(false);
		expect(onStop).toHaveBeenCalledTimes(1);
	});

	it("ignores throttled scroll handlers after scrollend", () => {
		const element = createScrollElement();
		const onStop = vi.fn();
		const scroll = useScroll(element, {
			idle: 100,
			onStop,
			throttle: 50,
			window: new FakeWindow(),
		});

		element.scrollTop = 40;
		element.dispatchEvent(new Event("scroll"));
		element.scrollTop = 80;
		element.dispatchEvent(new Event("scroll"));

		expect(scroll.isScrolling.value).toBe(true);

		element.dispatchEvent(new Event("scrollend"));
		expect(scroll.isScrolling.value).toBe(false);
		expect(scroll.y.value).toBe(80);
		expect(onStop).toHaveBeenCalledTimes(1);

		vi.advanceTimersByTime(50);
		expect(scroll.isScrolling.value).toBe(false);
		vi.advanceTimersByTime(100);
		expect(onStop).toHaveBeenCalledTimes(1);
	});

	it("writes scroll position through x and y computed values", () => {
		const element = createScrollElement();
		const scroll = useScroll(element, {
			behavior: "smooth",
			window: new FakeWindow(),
		});

		scroll.x.value = 50;
		scroll.y.value = 75;

		expect(element.scrollLeft).toBe(50);
		expect(element.scrollTop).toBe(75);
		expect(scroll.x.value).toBe(50);
		expect(scroll.y.value).toBe(75);
	});

	it("supports explicit scrollTo options", () => {
		const element = createScrollElement();
		const scrollTo = vi.fn((options?: ScrollToOptions) => {
			element.scrollLeft = options?.left ?? element.scrollLeft;
			element.scrollTop = options?.top ?? element.scrollTop;
		});
		Object.defineProperty(element, "scrollTo", {
			configurable: true,
			value: scrollTo,
		});
		const scroll = useScroll(element, {
			behavior: "smooth",
			window: new FakeWindow(),
		});

		scroll.scrollTo({ behavior: "auto", left: 24, top: 48 });

		expect(scrollTo).toHaveBeenCalledWith({
			behavior: "auto",
			left: 24,
			top: 48,
		});
		expect(scroll.x.value).toBe(24);
		expect(scroll.y.value).toBe(48);
	});

	it("applies offsets and reverse flex direction to arrived state", () => {
		const element = createScrollElement({
			clientHeight: 100,
			clientWidth: 100,
			scrollHeight: 200,
			scrollLeft: 20,
			scrollTop: 100,
			scrollWidth: 200,
		});
		element.dataset.display = "flex";
		element.dataset.flexDirection = "column-reverse";
		const scroll = useScroll(element, {
			offset: { bottom: 1, left: 20, top: 1 },
			window: new FakeWindow(),
		});

		expect(scroll.arrivedState.value).toEqual({
			bottom: false,
			left: true,
			right: false,
			top: true,
		});
	});

	it("handles rtl horizontal arrival", () => {
		const element = createScrollElement({
			clientWidth: 100,
			scrollLeft: -100,
			scrollWidth: 200,
		});
		element.dataset.direction = "rtl";
		const scroll = useScroll(element, { window: new FakeWindow() });

		expect(scroll.arrivedState.value.left).toBe(false);
		expect(scroll.arrivedState.value.right).toBe(true);
	});

	it("measures document targets through documentElement with body fallback", () => {
		const documentElement = document.documentElement;
		setMetrics(documentElement, {
			clientHeight: 100,
			clientWidth: 100,
			scrollHeight: 200,
			scrollLeft: 12,
			scrollTop: 0,
			scrollWidth: 200,
		});
		setMetrics(document.body, {
			scrollTop: 64,
		});
		const scroll = useScroll(document, { window: new FakeWindow() });

		expect(scroll.x.value).toBe(12);
		expect(scroll.y.value).toBe(64);

		scroll.stop();
	});

	it("scrolls document targets through the configured window", () => {
		const fakeWindow = new FakeWindow();
		const documentElement = document.documentElement;
		setMetrics(documentElement, {
			clientHeight: 100,
			clientWidth: 100,
			scrollHeight: 200,
			scrollLeft: 0,
			scrollTop: 0,
			scrollWidth: 200,
		});
		const scroll = useScroll(document, { window: fakeWindow });

		scroll.scrollTo({ left: 20, top: 40 });

		expect(documentElement.scrollLeft).toBe(20);
		expect(documentElement.scrollTop).toBe(40);
		expect(scroll.x.value).toBe(20);
		expect(scroll.y.value).toBe(40);

		scroll.stop();
	});

	it("retargets listeners when the target changes", () => {
		const first = createScrollElement({ scrollTop: 10 });
		const second = createScrollElement({ scrollTop: 40 });
		const target = signal<HTMLElement | null>(first);
		const scroll = useScroll(target, { window: new FakeWindow() });

		expect(scroll.y.value).toBe(10);

		target.value = second;
		expect(scroll.y.value).toBe(40);

		first.scrollTop = 90;
		first.dispatchEvent(new Event("scroll"));
		expect(scroll.y.value).toBe(40);

		second.scrollTop = 120;
		second.dispatchEvent(new Event("scroll"));
		expect(scroll.y.value).toBe(120);
	});

	it("ignores throttled scroll handlers from a previous target", () => {
		const first = createScrollElement({ scrollTop: 10 });
		const second = createScrollElement({ scrollTop: 40 });
		const target = signal<HTMLElement | null>(first);
		const onScroll = vi.fn();
		const onStop = vi.fn();
		const scroll = useScroll(target, {
			idle: 100,
			onScroll,
			onStop,
			throttle: 50,
			window: new FakeWindow(),
		});

		first.scrollTop = 80;
		first.dispatchEvent(new Event("scroll"));
		first.scrollTop = 100;
		first.dispatchEvent(new Event("scroll"));

		expect(scroll.isScrolling.value).toBe(true);

		target.value = second;

		expect(scroll.y.value).toBe(40);
		expect(scroll.isScrolling.value).toBe(false);
		expect(onScroll).toHaveBeenCalledTimes(1);

		vi.advanceTimersByTime(50);

		expect(scroll.y.value).toBe(40);
		expect(onScroll).toHaveBeenCalledTimes(1);
		vi.advanceTimersByTime(100);
		expect(onStop).not.toHaveBeenCalled();
	});

	it("resets state when the target is unavailable", () => {
		const target = signal<HTMLElement | null>(
			createScrollElement({ scrollTop: 50 }),
		);
		const scroll = useScroll(target, { window: new FakeWindow() });

		expect(scroll.y.value).toBe(50);

		target.value = null;

		expect(scroll.x.value).toBe(0);
		expect(scroll.y.value).toBe(0);
		expect(scroll.isScrolling.value).toBe(false);
		expect(scroll.arrivedState.value).toEqual({
			bottom: false,
			left: true,
			right: false,
			top: true,
		});
	});

	it("observes DOM mutations when requested", () => {
		const element = createScrollElement({ scrollHeight: 80 });
		const scroll = useScroll(element, {
			observe: true,
			window: new FakeWindow(),
		});

		expect(scroll.arrivedState.value.bottom).toBe(true);
		expect(FakeMutationObserver.instances).toHaveLength(1);

		setMetrics(element, { scrollHeight: 200 });
		FakeMutationObserver.instances[0]?.emit(element);

		expect(scroll.arrivedState.value.bottom).toBe(false);
	});

	it("stops listeners and timers", () => {
		const element = createScrollElement();
		const onStop = vi.fn();
		const scroll = useScroll(element, {
			idle: 50,
			onStop,
			window: new FakeWindow(),
		});

		element.scrollTop = 60;
		element.dispatchEvent(new Event("scroll"));
		expect(scroll.isScrolling.value).toBe(true);

		scroll.stop();
		element.scrollTop = 100;
		element.dispatchEvent(new Event("scroll"));
		vi.advanceTimersByTime(50);

		expect(scroll.y.value).toBe(60);
		expect(scroll.isScrolling.value).toBe(false);
		expect(onStop).not.toHaveBeenCalled();
	});
});
