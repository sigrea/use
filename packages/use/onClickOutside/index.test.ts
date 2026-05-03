import {
	disposeTrackedMolecules,
	molecule,
	mountMolecule,
	signal,
	trackMolecule,
} from "@sigrea/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { onClickOutside } from "./index";

function dispatchPointerClick(element: Element) {
	element.dispatchEvent(
		new MouseEvent("pointerdown", { bubbles: true, composed: true }),
	);
	element.dispatchEvent(
		new MouseEvent("click", { bubbles: true, composed: true }),
	);
	vi.runOnlyPendingTimers();
}

function createManualClick(target: Element): Event {
	const event = new Event("click");
	Object.defineProperties(event, {
		target: { value: target },
		composedPath: {
			value: () => [target, document.body, document.documentElement, document],
		},
	});

	return event;
}

function dispatchManualClick(windowTarget: EventTarget, target: Element): void {
	windowTarget.dispatchEvent(createManualClick(target));
	vi.runOnlyPendingTimers();
}

class FakeWindow extends EventTarget {
	readonly document = document;

	setTimeout(
		handler: () => void,
		timeout?: number,
	): ReturnType<typeof globalThis.setTimeout> {
		return globalThis.setTimeout(handler, timeout);
	}

	clearTimeout(handle: ReturnType<typeof globalThis.setTimeout>): void {
		globalThis.clearTimeout(handle);
	}
}

describe("onClickOutside", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.restoreAllMocks();
		document.body.innerHTML = "";
		disposeTrackedMolecules();
	});

	it("calls the handler for outside clicks only", () => {
		const target = document.createElement("div");
		const child = document.createElement("button");
		const outside = document.createElement("button");
		target.append(child);
		document.body.append(target, outside);
		const handler = vi.fn();
		const stop = onClickOutside(target, handler);

		dispatchPointerClick(child);
		expect(handler).not.toHaveBeenCalled();

		dispatchPointerClick(outside);
		expect(handler).toHaveBeenCalledTimes(1);

		stop();
		dispatchPointerClick(outside);
		expect(handler).toHaveBeenCalledTimes(1);
	});

	it("ignores elements from reactive ignore entries and selectors", () => {
		const target = document.createElement("div");
		const ignoredByTarget = document.createElement("button");
		const ignoredBySelector = document.createElement("button");
		const outside = document.createElement("button");
		ignoredBySelector.className = "ignored";
		document.body.append(target, ignoredByTarget, ignoredBySelector, outside);
		const ignoredTarget = signal<Element | null>(ignoredByTarget);
		const handler = vi.fn();
		const stop = onClickOutside(target, handler, {
			ignore: () => [ignoredTarget, ".ignored"],
		});

		dispatchPointerClick(ignoredByTarget);
		dispatchPointerClick(ignoredBySelector);
		expect(handler).not.toHaveBeenCalled();

		ignoredTarget.value = null;
		dispatchPointerClick(ignoredByTarget);
		expect(handler).toHaveBeenCalledTimes(1);

		dispatchPointerClick(outside);
		expect(handler).toHaveBeenCalledTimes(2);

		stop();
	});

	it("returns controls when requested", () => {
		const target = document.createElement("div");
		const outside = document.createElement("button");
		document.body.append(target, outside);
		const handler = vi.fn();
		const controls = onClickOutside(target, handler, { controls: true });

		controls.cancel();
		dispatchPointerClick(outside);
		expect(handler).not.toHaveBeenCalled();

		controls.trigger(createManualClick(outside));
		expect(handler).toHaveBeenCalledTimes(1);

		dispatchPointerClick(outside);
		expect(handler).toHaveBeenCalledTimes(2);

		controls.stop();
		dispatchPointerClick(outside);
		expect(handler).toHaveBeenCalledTimes(2);
	});

	it("retargets target and window values", () => {
		const firstTarget = document.createElement("div");
		const secondTarget = document.createElement("div");
		const outside = document.createElement("button");
		document.body.append(firstTarget, secondTarget, outside);
		const target = signal<Element>(firstTarget);
		const firstWindow = new FakeWindow();
		const secondWindow = new FakeWindow();
		const windowTarget = signal(firstWindow);
		const handler = vi.fn();
		const stop = onClickOutside(target, handler, { window: windowTarget });

		dispatchManualClick(firstWindow, secondTarget);
		expect(handler).toHaveBeenCalledTimes(1);

		target.value = secondTarget;
		dispatchManualClick(firstWindow, secondTarget);
		expect(handler).toHaveBeenCalledTimes(1);

		dispatchManualClick(firstWindow, firstTarget);
		expect(handler).toHaveBeenCalledTimes(2);

		windowTarget.value = secondWindow;
		dispatchManualClick(firstWindow, outside);
		expect(handler).toHaveBeenCalledTimes(2);

		dispatchManualClick(secondWindow, outside);
		expect(handler).toHaveBeenCalledTimes(3);

		stop();
	});

	it("uses capture phase by default", () => {
		const target = document.createElement("div");
		document.body.append(target);
		const addSpy = vi.spyOn(window, "addEventListener");
		const stop = onClickOutside(target, vi.fn());

		expect(addSpy).toHaveBeenCalledWith(
			"click",
			expect.any(Function),
			expect.objectContaining({ capture: true, passive: true }),
		);

		stop();
	});

	it("does not fall back to the default window when window is null", () => {
		const target = document.createElement("div");
		const outside = document.createElement("button");
		document.body.append(target, outside);
		const addSpy = vi.spyOn(window, "addEventListener");
		const handler = vi.fn();
		const stop = onClickOutside(target, handler, { window: null });

		expect(addSpy).not.toHaveBeenCalled();

		dispatchPointerClick(outside);
		expect(handler).not.toHaveBeenCalled();

		stop();
	});

	it("can detect focus moving to an iframe", () => {
		const target = document.createElement("div");
		const iframe = document.createElement("iframe");
		document.body.append(target, iframe);
		const handler = vi.fn();
		const stop = onClickOutside(target, handler, { detectIframe: true });
		const activeElement = vi
			.spyOn(document, "activeElement", "get")
			.mockReturnValue(iframe);

		window.dispatchEvent(new FocusEvent("blur"));
		vi.runOnlyPendingTimers();

		expect(handler).toHaveBeenCalledTimes(1);

		activeElement.mockRestore();
		stop();
	});

	it("cancels a pending iframe blur handler on stop", () => {
		const target = document.createElement("div");
		const iframe = document.createElement("iframe");
		document.body.append(target, iframe);
		const handler = vi.fn();
		const stop = onClickOutside(target, handler, { detectIframe: true });
		const activeElement = vi
			.spyOn(document, "activeElement", "get")
			.mockReturnValue(iframe);

		window.dispatchEvent(new FocusEvent("blur"));
		stop();
		vi.runOnlyPendingTimers();

		expect(handler).not.toHaveBeenCalled();

		activeElement.mockRestore();
	});

	it("cancels a pending iframe blur handler when its molecule is disposed", () => {
		const target = document.createElement("div");
		const iframe = document.createElement("iframe");
		document.body.append(target, iframe);
		const handler = vi.fn();
		const OutsideMolecule = molecule(() => {
			return {
				stop: onClickOutside(target, handler, { detectIframe: true }),
			};
		});
		const instance = OutsideMolecule();
		trackMolecule(instance);
		mountMolecule(instance);
		const activeElement = vi
			.spyOn(document, "activeElement", "get")
			.mockReturnValue(iframe);

		window.dispatchEvent(new FocusEvent("blur"));
		disposeTrackedMolecules();
		vi.runOnlyPendingTimers();

		expect(handler).not.toHaveBeenCalled();

		activeElement.mockRestore();
	});

	it("cancels a pending iframe blur handler with controls", () => {
		const target = document.createElement("div");
		const iframe = document.createElement("iframe");
		document.body.append(target, iframe);
		const handler = vi.fn();
		const controls = onClickOutside(target, handler, {
			controls: true,
			detectIframe: true,
		});
		const activeElement = vi
			.spyOn(document, "activeElement", "get")
			.mockReturnValue(iframe);

		window.dispatchEvent(new FocusEvent("blur"));
		controls.cancel();
		vi.runOnlyPendingTimers();

		expect(handler).not.toHaveBeenCalled();

		activeElement.mockRestore();
		controls.stop();
	});

	it("clears pending iframe timers with the configured window", () => {
		const windowTarget = new FakeWindow();
		const clearTimeoutSpy = vi.spyOn(windowTarget, "clearTimeout");
		const target = document.createElement("div");
		const iframe = document.createElement("iframe");
		document.body.append(target, iframe);
		const handler = vi.fn();
		const controls = onClickOutside(target, handler, {
			controls: true,
			detectIframe: true,
			window: windowTarget,
		});
		const activeElement = vi
			.spyOn(document, "activeElement", "get")
			.mockReturnValue(iframe);

		windowTarget.dispatchEvent(new FocusEvent("blur"));
		controls.cancel();
		vi.runOnlyPendingTimers();

		expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);
		expect(handler).not.toHaveBeenCalled();

		activeElement.mockRestore();
		controls.stop();
	});

	it("clears pending click timers with the configured window", () => {
		const windowTarget = new FakeWindow();
		const clearTimeoutSpy = vi.spyOn(windowTarget, "clearTimeout");
		const target = document.createElement("div");
		const outside = document.createElement("button");
		document.body.append(target, outside);
		const handler = vi.fn();
		const controls = onClickOutside(target, handler, {
			controls: true,
			window: windowTarget,
		});

		windowTarget.dispatchEvent(createManualClick(outside));
		expect(handler).toHaveBeenCalledTimes(1);

		controls.cancel();
		expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);

		vi.runOnlyPendingTimers();
		controls.trigger(createManualClick(outside));
		expect(handler).toHaveBeenCalledTimes(2);

		controls.stop();
	});
});
