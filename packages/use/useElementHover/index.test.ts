import { disposeTrackedMolecules, signal } from "@sigrea/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useElementHover } from "./index";

function dispatchMouse(target: EventTarget, type: "mouseenter" | "mouseleave") {
	target.dispatchEvent(new MouseEvent(type, { bubbles: false }));
}

async function flushMutationObserver(): Promise<void> {
	await Promise.resolve();
	await Promise.resolve();
}

describe("useElementHover", () => {
	afterEach(() => {
		vi.useRealTimers();
		document.body.innerHTML = "";
		disposeTrackedMolecules();
	});

	it("tracks mouse enter and leave", () => {
		const element = document.createElement("button");
		const hover = useElementHover(element);

		expect(hover.isHovered.value).toBe(false);

		dispatchMouse(element, "mouseenter");
		expect(hover.isHovered.value).toBe(true);

		dispatchMouse(element, "mouseleave");
		expect(hover.isHovered.value).toBe(false);

		hover.stop();
	});

	it("applies enter and leave delays", () => {
		vi.useFakeTimers();
		const element = document.createElement("button");
		const hover = useElementHover(element, {
			delayEnter: 20,
			delayLeave: 30,
		});

		dispatchMouse(element, "mouseenter");
		expect(hover.isHovered.value).toBe(false);
		vi.advanceTimersByTime(19);
		expect(hover.isHovered.value).toBe(false);
		vi.advanceTimersByTime(1);
		expect(hover.isHovered.value).toBe(true);

		dispatchMouse(element, "mouseleave");
		expect(hover.isHovered.value).toBe(true);
		vi.advanceTimersByTime(29);
		expect(hover.isHovered.value).toBe(true);
		vi.advanceTimersByTime(1);
		expect(hover.isHovered.value).toBe(false);

		hover.stop();
	});

	it("reads delay values when the event fires", () => {
		vi.useFakeTimers();
		const element = document.createElement("button");
		const delayEnter = signal(20);
		const delayLeave = signal(30);
		const hover = useElementHover(element, {
			delayEnter,
			delayLeave,
		});

		delayEnter.value = 10;
		dispatchMouse(element, "mouseenter");
		vi.advanceTimersByTime(9);
		expect(hover.isHovered.value).toBe(false);
		vi.advanceTimersByTime(1);
		expect(hover.isHovered.value).toBe(true);

		delayLeave.value = 15;
		dispatchMouse(element, "mouseleave");
		vi.advanceTimersByTime(14);
		expect(hover.isHovered.value).toBe(true);
		vi.advanceTimersByTime(1);
		expect(hover.isHovered.value).toBe(false);

		hover.stop();
	});

	it("cancels a pending delayed enter when leave fires", () => {
		vi.useFakeTimers();
		const element = document.createElement("button");
		const hover = useElementHover(element, {
			delayEnter: 20,
			delayLeave: 20,
		});

		dispatchMouse(element, "mouseenter");
		vi.advanceTimersByTime(10);
		dispatchMouse(element, "mouseleave");
		vi.advanceTimersByTime(20);

		expect(hover.isHovered.value).toBe(false);

		hover.stop();
	});

	it("cancels a pending delayed leave when enter fires", () => {
		vi.useFakeTimers();
		const element = document.createElement("button");
		const hover = useElementHover(element, {
			delayEnter: 20,
			delayLeave: 20,
		});

		dispatchMouse(element, "mouseenter");
		vi.advanceTimersByTime(20);
		expect(hover.isHovered.value).toBe(true);

		dispatchMouse(element, "mouseleave");
		vi.advanceTimersByTime(10);
		dispatchMouse(element, "mouseenter");
		vi.advanceTimersByTime(20);

		expect(hover.isHovered.value).toBe(true);

		hover.stop();
	});

	it("supports reactive targets and resets stale hover state", () => {
		const first = document.createElement("button");
		const second = document.createElement("button");
		const target = signal<Element | null>(first);
		const hover = useElementHover(target);

		dispatchMouse(first, "mouseenter");
		expect(hover.isHovered.value).toBe(true);

		target.value = second;
		expect(hover.isHovered.value).toBe(false);

		dispatchMouse(first, "mouseenter");
		expect(hover.isHovered.value).toBe(false);

		dispatchMouse(second, "mouseenter");
		expect(hover.isHovered.value).toBe(true);

		target.value = null;
		expect(hover.isHovered.value).toBe(false);

		dispatchMouse(second, "mouseenter");
		expect(hover.isHovered.value).toBe(false);

		hover.stop();
	});

	it("does not reset hover on removal unless requested", async () => {
		const wrapper = document.createElement("div");
		const element = document.createElement("button");
		wrapper.append(element);
		document.body.append(wrapper);
		const hover = useElementHover(element);

		dispatchMouse(element, "mouseenter");
		expect(hover.isHovered.value).toBe(true);

		wrapper.removeChild(element);
		await flushMutationObserver();

		expect(hover.isHovered.value).toBe(true);

		hover.stop();
	});

	it("can reset hover when the element is removed", async () => {
		const wrapper = document.createElement("div");
		const element = document.createElement("button");
		wrapper.append(element);
		document.body.append(wrapper);
		const hover = useElementHover(element, { triggerOnRemoval: true });

		dispatchMouse(element, "mouseenter");
		expect(hover.isHovered.value).toBe(true);

		wrapper.removeChild(element);
		await flushMutationObserver();

		expect(hover.isHovered.value).toBe(false);

		hover.stop();
	});

	it("applies leave delay when the element is removed", async () => {
		vi.useFakeTimers();
		const wrapper = document.createElement("div");
		const element = document.createElement("button");
		wrapper.append(element);
		document.body.append(wrapper);
		const hover = useElementHover(element, {
			delayLeave: 20,
			triggerOnRemoval: true,
		});

		dispatchMouse(element, "mouseenter");
		expect(hover.isHovered.value).toBe(true);

		wrapper.removeChild(element);
		await flushMutationObserver();
		expect(hover.isHovered.value).toBe(true);

		vi.advanceTimersByTime(19);
		expect(hover.isHovered.value).toBe(true);
		vi.advanceTimersByTime(1);
		expect(hover.isHovered.value).toBe(false);

		hover.stop();
	});

	it("can observe removal from an explicit document root", async () => {
		const root = document.createElement("div");
		const element = document.createElement("button");
		root.append(element);
		const hover = useElementHover(element, {
			document: root,
			triggerOnRemoval: true,
		});

		dispatchMouse(element, "mouseenter");
		expect(hover.isHovered.value).toBe(true);

		root.removeChild(element);
		await flushMutationObserver();

		expect(hover.isHovered.value).toBe(false);

		hover.stop();
	});

	it("does not fall back to the default window when window is null", async () => {
		const wrapper = document.createElement("div");
		const element = document.createElement("button");
		wrapper.append(element);
		document.body.append(wrapper);
		const addSpy = vi.spyOn(window, "addEventListener");
		const hover = useElementHover(element, {
			triggerOnRemoval: true,
			window: null,
		});

		expect(addSpy).not.toHaveBeenCalled();

		dispatchMouse(element, "mouseenter");
		expect(hover.isHovered.value).toBe(true);

		wrapper.removeChild(element);
		await flushMutationObserver();
		expect(hover.isHovered.value).toBe(true);

		hover.stop();
		expect(hover.isHovered.value).toBe(false);

		addSpy.mockRestore();
	});

	it("resets hover after stop and clears pending timers", () => {
		vi.useFakeTimers();
		const element = document.createElement("button");
		const hover = useElementHover(element, { delayEnter: 20 });

		dispatchMouse(element, "mouseenter");
		hover.stop();
		hover.stop();
		vi.advanceTimersByTime(20);

		expect(hover.isHovered.value).toBe(false);

		dispatchMouse(element, "mouseenter");
		expect(hover.isHovered.value).toBe(false);
	});

	it("resets an active hover after stop", () => {
		const element = document.createElement("button");
		const hover = useElementHover(element);

		dispatchMouse(element, "mouseenter");
		expect(hover.isHovered.value).toBe(true);

		hover.stop();
		hover.stop();
		expect(hover.isHovered.value).toBe(false);

		dispatchMouse(element, "mouseenter");
		expect(hover.isHovered.value).toBe(false);
	});
});
