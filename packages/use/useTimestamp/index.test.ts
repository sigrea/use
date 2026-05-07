import {
	createScope,
	disposeScope,
	disposeTrackedMolecules,
	readonly,
	runWithScope,
	signal,
} from "@sigrea/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { UseIntervalFnReturn, UseTimestampReturn } from "../types";
import { useTimestamp } from "./index";

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

function stubAnimationFrame(): void {
	const timers = new Map<number, ReturnType<typeof setTimeout>>();
	let frameId = 0;

	vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
		frameId += 1;
		const id = frameId;
		const timer = setTimeout(() => {
			timers.delete(id);
			callback(performance.now());
		}, 16);

		timers.set(id, timer);
		return id;
	});

	vi.spyOn(window, "cancelAnimationFrame").mockImplementation((id) => {
		const timer = timers.get(id);
		if (timer === undefined) {
			return;
		}

		clearTimeout(timer);
		timers.delete(id);
	});
}

describe("useTimestamp", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
		stubAnimationFrame();
	});

	afterEach(() => {
		disposeTrackedMolecules();
		vi.restoreAllMocks();
		vi.useRealTimers();
	});

	it("returns the current timestamp as a readonly signal", () => {
		const timestamp = useTimestamp({ immediate: false, offset: 100 });

		expect(timestamp.value).toBe(1_767_225_600_100);
	});

	it("starts immediately with requestAnimationFrame by default", () => {
		const timestamp = useTimestamp();
		const initial = timestamp.value;

		vi.advanceTimersByTime(20);

		expect(timestamp.value).toBeGreaterThan(initial);
	});

	it("allows a delayed start with requestAnimationFrame controls", () => {
		const callback = vi.fn();
		const { resume, timestamp, isActive, pause } = useTimestamp({
			controls: true,
			immediate: false,
			callback,
		});
		const initial = timestamp.value;

		expect(isActive.value).toBe(false);
		vi.advanceTimersByTime(20);
		expect(timestamp.value).toBe(initial);
		expect(callback).not.toHaveBeenCalled();

		resume();
		expect(isActive.value).toBe(true);
		vi.advanceTimersByTime(20);

		expect(timestamp.value).toBeGreaterThan(initial);
		expect(callback).toHaveBeenLastCalledWith(timestamp.value);

		pause();
	});

	it("updates on an interval and resolves MaybeValue offset", () => {
		const offset = signal(5);
		const callback = vi.fn();
		const { resume, timestamp, pause } = useTimestamp({
			controls: true,
			immediate: false,
			interval: 50,
			offset,
			callback,
		});

		expect(timestamp.value).toBe(1_767_225_600_005);
		resume();
		vi.advanceTimersByTime(50);

		expect(timestamp.value).toBe(1_767_225_600_055);
		expect(callback).toHaveBeenLastCalledWith(1_767_225_600_055);

		offset.value = 10;
		vi.advanceTimersByTime(50);

		expect(timestamp.value).toBe(1_767_225_600_110);
		expect(callback).toHaveBeenLastCalledWith(1_767_225_600_110);

		pause();
	});

	it("uses a custom scheduler instead of interval options", () => {
		let scheduler!: ManualScheduler;
		const controlled = useTimestamp({
			controls: true,
			immediate: false,
			interval: 1000,
			scheduler: (callback) => {
				scheduler = new ManualScheduler(callback);
				scheduler.resume();
				return scheduler;
			},
		});
		const initial = controlled.timestamp.value;

		vi.advanceTimersByTime(1000);
		expect(controlled.timestamp.value).toBe(initial);

		scheduler.tick();
		expect(controlled.timestamp.value).toBe(1_767_225_601_000);
		expect(controlled.isActive.value).toBe(true);
	});

	it("stops an active interval when the duration becomes zero", () => {
		const interval = signal(1000);
		const controlled = useTimestamp({
			controls: true,
			interval,
		});

		expect(controlled.isActive.value).toBe(true);

		interval.value = 0;

		expect(controlled.isActive.value).toBe(false);
	});

	it("cleans up active interval updates with scope disposal", () => {
		const scope = createScope();
		let controlled!: UseTimestampReturn<true>;

		runWithScope(scope, () => {
			controlled = useTimestamp({
				controls: true,
				interval: 1000,
			});
		});

		expect(controlled.isActive.value).toBe(true);

		disposeScope(scope);
		vi.advanceTimersByTime(1000);

		expect(controlled.isActive.value).toBe(false);
		expect(controlled.timestamp.value).toBe(1_767_225_600_000);
	});
});
