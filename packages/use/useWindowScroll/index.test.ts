import { disposeTrackedMolecules, signal } from "@sigrea/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { UseScrollDocumentLike, UseScrollWindowLike } from "../types";
import { useWindowScroll } from "./index";

class FakeDocument extends EventTarget implements UseScrollDocumentLike {
	readonly documentElement = document.createElement("html");
	readonly body = document.createElement("body");
	scrollingElement: Element | null = this.documentElement;
}

class FakeWindow extends EventTarget implements UseScrollWindowLike {
	readonly document = new FakeDocument();
	readonly navigator = navigator;

	getComputedStyle(element: Element): CSSStyleDeclaration {
		return (element as HTMLElement).dataset as unknown as Pick<
			CSSStyleDeclaration,
			"direction" | "display" | "flexDirection"
		> as CSSStyleDeclaration;
	}

	scrollTo(options: ScrollToOptions = {}): void {
		const element =
			this.document.scrollingElement ?? this.document.documentElement;
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

function createWindow(metrics: ScrollMetrics = {}): FakeWindow {
	const fakeWindow = new FakeWindow();
	setMetrics(fakeWindow.document.documentElement, {
		clientHeight: 100,
		clientWidth: 100,
		scrollHeight: 200,
		scrollLeft: 0,
		scrollTop: 0,
		scrollWidth: 200,
		...metrics,
	});

	return fakeWindow;
}

describe("useWindowScroll", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		disposeTrackedMolecules();
		vi.useRealTimers();
	});

	it("measures the initial window scroll state", () => {
		const scroll = useWindowScroll({
			window: createWindow({
				scrollLeft: 24,
				scrollTop: 48,
			}),
		});

		expect(scroll.x.value).toBe(24);
		expect(scroll.y.value).toBe(48);
	});

	it("reads window scroll from the document scrolling element", () => {
		const fakeWindow = createWindow();
		fakeWindow.document.scrollingElement = fakeWindow.document.body;
		setMetrics(fakeWindow.document.body, {
			clientHeight: 100,
			clientWidth: 100,
			scrollHeight: 200,
			scrollLeft: 18,
			scrollTop: 64,
			scrollWidth: 200,
		});
		const scroll = useWindowScroll({ window: fakeWindow });

		expect(scroll.x.value).toBe(18);
		expect(scroll.y.value).toBe(64);

		fakeWindow.document.body.scrollTop = 96;
		fakeWindow.dispatchEvent(new Event("scroll"));

		expect(scroll.y.value).toBe(96);
	});

	it("updates from window scroll and scrollend events", () => {
		const fakeWindow = createWindow();
		const onScroll = vi.fn();
		const onStop = vi.fn();
		const scroll = useWindowScroll({
			idle: 100,
			onScroll,
			onStop,
			window: fakeWindow,
		});

		fakeWindow.document.documentElement.scrollTop = 60;
		fakeWindow.dispatchEvent(new Event("scroll"));

		expect(scroll.y.value).toBe(60);
		expect(scroll.isScrolling.value).toBe(true);
		expect(onScroll).toHaveBeenCalledTimes(1);

		fakeWindow.dispatchEvent(new Event("scrollend"));

		expect(scroll.isScrolling.value).toBe(false);
		expect(onStop).toHaveBeenCalledTimes(1);
	});

	it("scrolls through the window target", () => {
		const fakeWindow = createWindow();
		const scroll = useWindowScroll({
			behavior: "smooth",
			window: fakeWindow,
		});

		scroll.x.value = 12;
		scroll.scrollTo({ behavior: "auto", top: 34 });

		expect(fakeWindow.document.documentElement.scrollLeft).toBe(12);
		expect(fakeWindow.document.documentElement.scrollTop).toBe(34);
		expect(scroll.x.value).toBe(12);
		expect(scroll.y.value).toBe(34);
	});

	it("retargets listeners when the window changes", () => {
		const firstWindow = createWindow({ scrollTop: 10 });
		const secondWindow = createWindow({ scrollTop: 40 });
		const currentWindow = signal<FakeWindow | null>(firstWindow);
		const scroll = useWindowScroll({
			window: currentWindow,
		});

		expect(scroll.y.value).toBe(10);

		currentWindow.value = secondWindow;
		expect(scroll.y.value).toBe(40);

		firstWindow.document.documentElement.scrollTop = 90;
		firstWindow.dispatchEvent(new Event("scroll"));
		expect(scroll.y.value).toBe(40);

		secondWindow.document.documentElement.scrollTop = 120;
		secondWindow.dispatchEvent(new Event("scroll"));
		expect(scroll.y.value).toBe(120);
	});

	it("resets state when the window is unavailable", () => {
		const currentWindow = signal<FakeWindow | null>(
			createWindow({ scrollLeft: 20, scrollTop: 50 }),
		);
		const scroll = useWindowScroll({
			window: currentWindow,
		});

		expect(scroll.x.value).toBe(20);
		expect(scroll.y.value).toBe(50);

		currentWindow.value = null;

		expect(scroll.x.value).toBe(0);
		expect(scroll.y.value).toBe(0);
		expect(scroll.isScrolling.value).toBe(false);
	});

	it("respects an explicitly unavailable window", () => {
		const scroll = useWindowScroll({
			window: null,
		});

		expect(scroll.x.value).toBe(0);
		expect(scroll.y.value).toBe(0);
		expect(scroll.isScrolling.value).toBe(false);

		scroll.scrollTo({ left: 10, top: 20 });

		expect(scroll.x.value).toBe(0);
		expect(scroll.y.value).toBe(0);

		scroll.stop();
	});

	it("stops listeners and timers", () => {
		const fakeWindow = createWindow();
		const onStop = vi.fn();
		const scroll = useWindowScroll({
			idle: 50,
			onStop,
			window: fakeWindow,
		});

		fakeWindow.document.documentElement.scrollTop = 60;
		fakeWindow.dispatchEvent(new Event("scroll"));
		expect(scroll.isScrolling.value).toBe(true);

		scroll.stop();
		fakeWindow.document.documentElement.scrollTop = 100;
		fakeWindow.dispatchEvent(new Event("scroll"));
		vi.advanceTimersByTime(50);

		expect(scroll.y.value).toBe(60);
		expect(scroll.isScrolling.value).toBe(false);
		expect(onStop).not.toHaveBeenCalled();
	});
});
