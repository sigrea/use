import {
	createScope,
	disposeScope,
	disposeTrackedMolecules,
	runWithScope,
	signal,
} from "@sigrea/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { UseScrollLockElement, UseScrollLockWindowLike } from "../types";
import { useScrollLock } from "./index";

class FakeWindow extends EventTarget implements UseScrollLockWindowLike {
	readonly document = document;
	readonly navigator: UseScrollLockWindowLike["navigator"];

	constructor(
		options: {
			maxTouchPoints?: number;
			platform?: string;
			userAgent?: string;
		} = {},
	) {
		super();
		this.navigator = {
			maxTouchPoints: options.maxTouchPoints ?? 0,
			platform: options.platform ?? "",
			userAgent: options.userAgent ?? "",
		};
	}

	readonly getComputedStyle = vi.fn((element: Element) => {
		const target = element as HTMLElement;

		return {
			overflowX: target.dataset.overflowX ?? "",
			overflowY: target.dataset.overflowY ?? "",
		} as CSSStyleDeclaration;
	});
}

interface ElementMetrics {
	clientHeight?: number;
	clientWidth?: number;
	scrollHeight?: number;
	scrollWidth?: number;
}

function setMetrics(element: Element, metrics: ElementMetrics) {
	for (const [key, value] of Object.entries(metrics)) {
		Object.defineProperty(element, key, {
			configurable: true,
			value,
		});
	}
}

function createElement(overflow = ""): HTMLElement {
	const element = document.createElement("div");
	element.style.overflow = overflow;
	document.body.append(element);

	return element;
}

function createTouchMoveEvent(touchCount = 1): TouchEvent {
	const event = new Event("touchmove", {
		cancelable: true,
	}) as TouchEvent;
	Object.defineProperty(event, "touches", {
		configurable: true,
		value: Array.from({ length: touchCount }, () => ({})),
	});

	return event;
}

describe("useScrollLock", () => {
	afterEach(() => {
		document.body.innerHTML = "";
		document.documentElement.removeAttribute("style");
		disposeTrackedMolecules();
		vi.restoreAllMocks();
	});

	it("locks and restores an element through a writable computed value", () => {
		const element = createElement("auto");
		const isLocked = useScrollLock(element, false, {
			window: new FakeWindow(),
		});

		expect(isLocked.value).toBe(false);
		expect(element.style.overflow).toBe("auto");

		isLocked.value = true;
		expect(isLocked.value).toBe(true);
		expect(element.style.overflow).toBe("hidden");

		isLocked.value = false;
		expect(isLocked.value).toBe(false);
		expect(element.style.overflow).toBe("auto");

		isLocked.stop();
	});

	it("applies the initial locked state when the target is available", () => {
		const element = createElement();
		const isLocked = useScrollLock(element, true, { window: new FakeWindow() });

		expect(isLocked.value).toBe(true);
		expect(element.style.overflow).toBe("hidden");

		isLocked.stop();
		expect(element.style.overflow).toBe("");
	});

	it("treats a pre-hidden element as locked without losing its original overflow", () => {
		const element = createElement("hidden");
		const isLocked = useScrollLock(element, false, {
			window: new FakeWindow(),
		});

		expect(isLocked.value).toBe(true);
		expect(element.style.overflow).toBe("hidden");

		isLocked.value = false;
		expect(isLocked.value).toBe(false);
		expect(element.style.overflow).toBe("hidden");
	});

	it("moves the lock when a signal target changes", () => {
		const first = createElement("auto");
		const second = createElement("scroll");
		const target = signal<UseScrollLockElement>(first);
		const isLocked = useScrollLock(target, true, { window: new FakeWindow() });

		expect(first.style.overflow).toBe("hidden");
		expect(second.style.overflow).toBe("scroll");

		target.value = second;
		expect(first.style.overflow).toBe("auto");
		expect(second.style.overflow).toBe("hidden");

		target.value = null;
		expect(second.style.overflow).toBe("scroll");
		expect(isLocked.value).toBe(true);

		target.value = first;
		expect(first.style.overflow).toBe("hidden");

		isLocked.stop();
		expect(first.style.overflow).toBe("auto");
	});

	it("keeps a shared element locked until the last instance stops", () => {
		const element = createElement("auto");
		const first = useScrollLock(element, true, { window: new FakeWindow() });
		const second = useScrollLock(element, true, { window: new FakeWindow() });

		first.stop();
		expect(element.style.overflow).toBe("hidden");

		second.stop();
		expect(element.style.overflow).toBe("auto");
	});

	it("resolves window and document targets to documentElement", () => {
		document.documentElement.style.overflow = "auto";
		const fakeWindow = new FakeWindow();
		const fromWindow = useScrollLock(fakeWindow, true, { window: fakeWindow });

		expect(document.documentElement.style.overflow).toBe("hidden");

		fromWindow.stop();
		expect(document.documentElement.style.overflow).toBe("auto");

		const fromDocument = useScrollLock(document, true, { window: fakeWindow });
		expect(document.documentElement.style.overflow).toBe("hidden");

		fromDocument.stop();
		expect(document.documentElement.style.overflow).toBe("auto");
	});

	it("prevents iOS touchmove events unless the target can scroll", () => {
		const fakeWindow = new FakeWindow({ platform: "iPhone" });
		const element = createElement();
		const scrollable = document.createElement("section");
		const child = document.createElement("button");
		scrollable.dataset.overflowY = "auto";
		setMetrics(scrollable, {
			clientHeight: 100,
			scrollHeight: 160,
		});
		scrollable.append(child);
		element.append(scrollable);
		const isLocked = useScrollLock(element, true, { window: fakeWindow });

		const blockedEvent = createTouchMoveEvent();
		element.dispatchEvent(blockedEvent);
		expect(blockedEvent.defaultPrevented).toBe(true);

		const scrollableEvent = createTouchMoveEvent();
		child.dispatchEvent(scrollableEvent);
		expect(scrollableEvent.defaultPrevented).toBe(false);

		const multiTouchEvent = createTouchMoveEvent(2);
		element.dispatchEvent(multiTouchEvent);
		expect(multiTouchEvent.defaultPrevented).toBe(false);

		isLocked.stop();
	});

	it("does not attach iOS touch listeners when window is null", () => {
		const element = createElement();
		const addEventListener = vi.spyOn(element, "addEventListener");
		const isLocked = useScrollLock(element, true, { window: null });

		expect(element.style.overflow).toBe("hidden");
		expect(addEventListener).not.toHaveBeenCalledWith(
			"touchmove",
			expect.any(Function),
			expect.objectContaining({ passive: false }),
		);

		isLocked.stop();
	});

	it("cleans up when the current scope is disposed", () => {
		const element = createElement("auto");
		const scope = createScope();
		const isLocked = runWithScope(scope, () =>
			useScrollLock(element, true, { window: new FakeWindow() }),
		);

		expect(element.style.overflow).toBe("hidden");

		disposeScope(scope);
		expect(element.style.overflow).toBe("auto");
		expect(isLocked.value).toBe(false);
	});

	it("is safe without a target", () => {
		const isLocked = useScrollLock(null, true, { window: null });

		expect(isLocked.value).toBe(true);
		isLocked.value = false;
		expect(isLocked.value).toBe(false);

		isLocked.stop();
	});
});
