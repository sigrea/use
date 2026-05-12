// @vitest-environment node

import {
	disposeTrackedMolecules,
	molecule,
	mountMolecule,
	signal,
	trackMolecule,
	unmountMolecule,
} from "@sigrea/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { UseIdleDocumentLike, UseIdleWindowLike } from "../types";
import { useIdle } from "./index";

class FakeDocument extends EventTarget implements UseIdleDocumentLike {
	hidden = false;
}

class FakeWindow extends EventTarget implements UseIdleWindowLike {
	readonly document = new FakeDocument();
	readonly listeners = new Map<
		string,
		Set<EventListenerOrEventListenerObject>
	>();

	addEventListener(
		type: string,
		callback: EventListenerOrEventListenerObject | null,
		options?: boolean | AddEventListenerOptions,
	): void {
		if (callback !== null) {
			const listeners = this.listeners.get(type) ?? new Set();
			listeners.add(callback);
			this.listeners.set(type, listeners);
		}
		super.addEventListener(type, callback, options);
	}

	removeEventListener(
		type: string,
		callback: EventListenerOrEventListenerObject | null,
		options?: boolean | EventListenerOptions,
	): void {
		this.listeners
			.get(type)
			?.delete(callback as EventListenerOrEventListenerObject);
		super.removeEventListener(type, callback, options);
	}

	listenerCount(type: string): number {
		return this.listeners.get(type)?.size ?? 0;
	}
}

describe("useIdle", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(1000);
	});

	afterEach(() => {
		disposeTrackedMolecules();
		vi.useRealTimers();
		vi.unstubAllGlobals();
	});

	it("stays stopped when window is null", () => {
		const globalWindow = new FakeWindow();
		vi.stubGlobal("window", globalWindow);
		const idle = useIdle(1000, { window: null });

		expect(idle.idle.value).toBe(false);
		expect(idle.isPending.value).toBe(false);
		expect(globalWindow.listenerCount("mousemove")).toBe(0);

		idle.start();
		expect(idle.isPending.value).toBe(false);
		expect(globalWindow.listenerCount("mousemove")).toBe(0);
	});

	it("becomes idle after the timeout and resets on activity", () => {
		const window = new FakeWindow();
		const idle = useIdle(1000, { window });

		expect(idle.idle.value).toBe(false);
		expect(idle.isPending.value).toBe(true);
		expect(window.listenerCount("mousemove")).toBe(1);

		vi.advanceTimersByTime(1000);
		expect(idle.idle.value).toBe(true);

		vi.setSystemTime(2500);
		window.dispatchEvent(new Event("mousemove"));

		expect(idle.idle.value).toBe(false);
		expect(idle.lastActive.value).toBe(2500);

		vi.advanceTimersByTime(1000);
		expect(idle.idle.value).toBe(true);
	});

	it("updates lastActive when reset is called directly", () => {
		const window = new FakeWindow();
		const idle = useIdle(1000, { window });

		vi.advanceTimersByTime(1000);
		expect(idle.idle.value).toBe(true);
		expect(idle.lastActive.value).toBe(1000);

		vi.setSystemTime(3000);
		idle.reset();

		expect(idle.idle.value).toBe(false);
		expect(idle.lastActive.value).toBe(3000);

		vi.advanceTimersByTime(1000);
		expect(idle.idle.value).toBe(true);
	});

	it("accepts custom activity events", () => {
		const window = new FakeWindow();
		const idle = useIdle(1000, {
			events: ["click", "keypress"],
			window,
		});

		vi.advanceTimersByTime(1000);
		expect(idle.idle.value).toBe(true);

		window.dispatchEvent(new Event("mousemove"));
		expect(idle.idle.value).toBe(true);

		window.dispatchEvent(new Event("click"));
		expect(idle.idle.value).toBe(false);
	});

	it("handles visibility changes when enabled", () => {
		const window = new FakeWindow();
		const enabled = useIdle(1000, { window });

		vi.advanceTimersByTime(1000);
		window.document.hidden = true;
		window.document.dispatchEvent(new Event("visibilitychange"));
		expect(enabled.idle.value).toBe(true);

		window.document.hidden = false;
		window.document.dispatchEvent(new Event("visibilitychange"));
		expect(enabled.idle.value).toBe(false);

		enabled.stop();
		const disabled = useIdle(1000, {
			listenForVisibilityChange: false,
			window,
		});
		vi.advanceTimersByTime(1000);
		window.document.dispatchEvent(new Event("visibilitychange"));
		expect(disabled.idle.value).toBe(true);
	});

	it("stops tracking and can start again", () => {
		const window = new FakeWindow();
		const idle = useIdle(1000, { window });

		idle.stop();
		expect(idle.idle.value).toBe(false);
		expect(idle.isPending.value).toBe(false);
		expect(window.listenerCount("mousemove")).toBe(0);

		vi.advanceTimersByTime(1000);
		expect(idle.idle.value).toBe(false);

		idle.start();
		expect(idle.isPending.value).toBe(true);
		expect(window.listenerCount("mousemove")).toBe(1);

		vi.advanceTimersByTime(1000);
		expect(idle.idle.value).toBe(true);
	});

	it("keeps lastActive when tracking starts without activity", () => {
		const window = new FakeWindow();
		const idle = useIdle(1000, { window });

		idle.stop();
		vi.setSystemTime(3000);
		idle.start();

		expect(idle.isPending.value).toBe(true);
		expect(idle.lastActive.value).toBe(1000);
	});

	it("respects initial idle state", () => {
		const window = new FakeWindow();
		const idle = useIdle(1000, { initialState: true, window });

		expect(idle.idle.value).toBe(true);
		expect(idle.isPending.value).toBe(true);

		window.dispatchEvent(new Event("mousemove"));
		expect(idle.idle.value).toBe(false);

		idle.stop();
		expect(idle.idle.value).toBe(true);

		idle.start();
		expect(idle.idle.value).toBe(true);
	});

	it("retargets listeners while tracking", () => {
		const first = new FakeWindow();
		const second = new FakeWindow();
		const target = signal<UseIdleWindowLike | null>(first);
		const idle = useIdle(1000, { window: target });

		expect(first.listenerCount("mousemove")).toBe(1);
		target.value = second;

		expect(first.listenerCount("mousemove")).toBe(0);
		expect(second.listenerCount("mousemove")).toBe(1);
		expect(idle.lastActive.value).toBe(1000);

		vi.advanceTimersByTime(1000);
		expect(idle.idle.value).toBe(true);

		first.dispatchEvent(new Event("mousemove"));
		expect(idle.idle.value).toBe(true);

		second.dispatchEvent(new Event("mousemove"));
		expect(idle.idle.value).toBe(false);
	});

	it("keeps the idle timer across retargets after activity", () => {
		const first = new FakeWindow();
		const second = new FakeWindow();
		const target = signal<UseIdleWindowLike | null>(first);
		const idle = useIdle(1000, { initialState: true, window: target });

		first.dispatchEvent(new Event("mousemove"));
		expect(idle.idle.value).toBe(false);

		target.value = second;
		vi.advanceTimersByTime(1000);

		expect(idle.idle.value).toBe(true);
	});

	it("starts when a reactive window target becomes available", () => {
		const window = new FakeWindow();
		const target = signal<UseIdleWindowLike | null>(null);
		const idle = useIdle(1000, { window: target });

		expect(idle.isPending.value).toBe(false);
		target.value = window;

		expect(idle.isPending.value).toBe(true);
		expect(window.listenerCount("mousemove")).toBe(1);

		vi.advanceTimersByTime(1000);
		expect(idle.idle.value).toBe(true);
	});

	it("resumes tracking after a reactive window target returns from null", () => {
		const first = new FakeWindow();
		const second = new FakeWindow();
		const target = signal<UseIdleWindowLike | null>(first);
		const idle = useIdle(1000, { window: target });

		target.value = null;
		expect(idle.isPending.value).toBe(false);
		expect(first.listenerCount("mousemove")).toBe(0);

		target.value = second;
		expect(idle.isPending.value).toBe(true);
		expect(second.listenerCount("mousemove")).toBe(1);

		vi.advanceTimersByTime(1000);
		expect(idle.idle.value).toBe(true);
	});

	it("starts on molecule mount and stops on unmount", () => {
		const window = new FakeWindow();
		const IdleMolecule = molecule(() => useIdle(1000, { window }));
		const instance = IdleMolecule();
		trackMolecule(instance);

		expect(instance.isPending.value).toBe(false);
		expect(window.listenerCount("mousemove")).toBe(0);

		mountMolecule(instance);
		expect(instance.isPending.value).toBe(true);
		expect(window.listenerCount("mousemove")).toBe(1);

		unmountMolecule(instance);
		expect(instance.isPending.value).toBe(false);
		expect(window.listenerCount("mousemove")).toBe(0);
	});
});
