import { disposeTrackedMolecules, readonly, signal } from "@sigrea/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { UseIntervalFnReturn, UseNowWindowLike } from "../types";
import { useNow } from "./index";

class FakeFrameWindow extends EventTarget implements UseNowWindowLike {
	private frameId = 0;
	private readonly frames = new Map<number, FrameRequestCallback>();

	requestAnimationFrame(callback: FrameRequestCallback): number {
		this.frameId += 1;
		this.frames.set(this.frameId, callback);
		return this.frameId;
	}

	cancelAnimationFrame(handle: number): void {
		this.frames.delete(handle);
	}

	get pendingFrames(): number {
		return this.frames.size;
	}

	flushNextFrame(time = performance.now()): void {
		const next = this.frames.entries().next().value as
			| [number, FrameRequestCallback]
			| undefined;
		if (next === undefined) {
			return;
		}

		const [handle, callback] = next;
		this.frames.delete(handle);
		callback(time);
	}
}

class ManualScheduler implements UseIntervalFnReturn {
	readonly active = signal(false);
	readonly isActive = readonly(this.active);

	constructor(private readonly callback: () => void) {}

	pause(): void {
		this.active.value = false;
	}

	resume(): void {
		this.active.value = true;
	}

	tick(): void {
		if (this.active.value) {
			this.callback();
		}
	}
}

describe("useNow", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
	});

	afterEach(() => {
		disposeTrackedMolecules();
		vi.unstubAllGlobals();
		vi.useRealTimers();
	});

	it("returns the current date as a readonly signal", () => {
		const now = useNow({ immediate: false });

		expect(now.value).toEqual(new Date("2026-01-01T00:00:00.000Z"));
	});

	it("updates on an interval", () => {
		const now = useNow({ interval: 1000 });

		vi.advanceTimersByTime(1000);

		expect(now.value).toEqual(new Date("2026-01-01T00:00:01.000Z"));
	});

	it("exposes pause and resume controls", () => {
		const now = useNow({
			controls: true,
			interval: 1000,
			immediate: false,
		});

		expect(now.isActive.value).toBe(false);
		now.resume();
		expect(now.isActive.value).toBe(true);

		vi.advanceTimersByTime(1000);
		expect(now.now.value).toEqual(new Date("2026-01-01T00:00:01.000Z"));

		now.pause();
		vi.advanceTimersByTime(1000);
		expect(now.now.value).toEqual(new Date("2026-01-01T00:00:01.000Z"));
	});

	it("uses requestAnimationFrame by default", () => {
		const frameWindow = new FakeFrameWindow();
		const now = useNow({
			controls: true,
			window: frameWindow,
		});

		expect(now.isActive.value).toBe(true);
		expect(frameWindow.pendingFrames).toBe(1);

		vi.setSystemTime(new Date("2026-01-01T00:00:00.016Z"));
		frameWindow.flushNextFrame();

		expect(now.now.value).toEqual(new Date("2026-01-01T00:00:00.016Z"));
		expect(frameWindow.pendingFrames).toBe(1);

		now.pause();
		expect(now.isActive.value).toBe(false);
		expect(frameWindow.pendingFrames).toBe(0);
	});

	it("does not fall back to global requestAnimationFrame when window is null", () => {
		const requestAnimationFrame = vi.fn();
		vi.stubGlobal("requestAnimationFrame", requestAnimationFrame);
		const now = useNow({
			controls: true,
			window: null,
		});

		expect(now.isActive.value).toBe(false);
		expect(requestAnimationFrame).not.toHaveBeenCalled();
	});

	it("uses a custom scheduler instead of interval options", () => {
		let scheduler!: ManualScheduler;
		const now = useNow({
			controls: true,
			immediate: false,
			interval: 1000,
			scheduler: (callback) => {
				scheduler = new ManualScheduler(callback);
				scheduler.resume();
				return scheduler;
			},
		});

		expect(now.isActive.value).toBe(true);
		vi.setSystemTime(new Date("2026-01-01T00:00:03.000Z"));
		scheduler.tick();

		expect(now.now.value).toEqual(new Date("2026-01-01T00:00:03.000Z"));
	});

	it("stops an active interval when the duration becomes zero", () => {
		const interval = signal(1000);
		const now = useNow({
			controls: true,
			interval,
		});

		expect(now.isActive.value).toBe(true);

		interval.value = 0;
		expect(now.isActive.value).toBe(false);
	});
});
