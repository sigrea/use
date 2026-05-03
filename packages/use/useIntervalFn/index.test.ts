// @vitest-environment node

import {
	disposeTrackedMolecules,
	molecule,
	mountMolecule,
	signal,
	trackMolecule,
	unmountMolecule,
} from "@sigrea/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useIntervalFn } from "./index";

describe("useIntervalFn", () => {
	afterEach(() => {
		disposeTrackedMolecules();
		vi.useRealTimers();
	});

	it("starts, pauses, and resumes an interval", () => {
		vi.useFakeTimers();
		const callback = vi.fn();
		const interval = useIntervalFn(callback, 20, {
			immediate: true,
			immediateCallback: true,
		});

		expect(callback).toHaveBeenCalledTimes(1);
		expect(interval.isActive.value).toBe(true);

		vi.advanceTimersByTime(60);
		expect(callback).toHaveBeenCalledTimes(4);

		interval.pause();
		vi.advanceTimersByTime(60);
		expect(callback).toHaveBeenCalledTimes(4);

		interval.resume();
		vi.advanceTimersByTime(20);
		expect(callback).toHaveBeenCalledTimes(6);
	});

	it("uses a 1000ms interval and starts immediately by default", () => {
		vi.useFakeTimers();
		const callback = vi.fn();
		const interval = useIntervalFn(callback);

		expect(globalThis.window).toBeUndefined();
		expect(interval.isActive.value).toBe(true);
		vi.advanceTimersByTime(999);
		expect(callback).not.toHaveBeenCalled();

		vi.advanceTimersByTime(1);
		expect(callback).toHaveBeenCalledTimes(1);

		interval.pause();
	});

	it("restarts an active interval when the duration changes", () => {
		vi.useFakeTimers();
		const callback = vi.fn();
		const intervalMs = signal(20);
		const interval = useIntervalFn(callback, intervalMs, {
			immediate: true,
		});

		vi.advanceTimersByTime(40);
		expect(callback).toHaveBeenCalledTimes(2);

		intervalMs.value = 10;
		vi.advanceTimersByTime(30);
		expect(callback).toHaveBeenCalledTimes(5);

		interval.pause();
	});

	it("stops an active interval when the duration becomes zero or less", () => {
		vi.useFakeTimers();
		const callback = vi.fn();
		const intervalMs = signal(20);
		const interval = useIntervalFn(callback, intervalMs, {
			immediate: true,
		});

		vi.advanceTimersByTime(20);
		expect(callback).toHaveBeenCalledTimes(1);
		expect(interval.isActive.value).toBe(true);

		intervalMs.value = 0;
		expect(interval.isActive.value).toBe(false);

		vi.advanceTimersByTime(100);
		expect(callback).toHaveBeenCalledTimes(1);
	});

	it("does not keep running when immediateCallback pauses it", () => {
		vi.useFakeTimers();
		let interval!: ReturnType<typeof useIntervalFn>;
		const callback = vi.fn(() => {
			interval.pause();
		});
		const IntervalMolecule = molecule(() => {
			interval = useIntervalFn(callback, 20, {
				immediate: true,
				immediateCallback: true,
			});
			return interval;
		});
		const instance = IntervalMolecule();
		trackMolecule(instance);

		mountMolecule(instance);
		expect(callback).toHaveBeenCalledTimes(1);
		expect(instance.isActive.value).toBe(false);

		vi.advanceTimersByTime(100);
		expect(callback).toHaveBeenCalledTimes(1);
	});

	it("does not start an interval when the duration is zero or less", () => {
		vi.useFakeTimers();
		const callback = vi.fn();
		const interval = useIntervalFn(callback, 0, {
			immediate: true,
		});

		expect(interval.isActive.value).toBe(false);
		vi.advanceTimersByTime(100);
		expect(callback).toHaveBeenCalledTimes(0);
	});

	it("starts an immediate interval on molecule mount and pauses on unmount", () => {
		vi.useFakeTimers();
		const callback = vi.fn();
		const IntervalMolecule = molecule(() =>
			useIntervalFn(callback, 20, { immediate: true }),
		);
		const instance = IntervalMolecule();
		trackMolecule(instance);

		vi.advanceTimersByTime(40);
		expect(callback).toHaveBeenCalledTimes(0);
		expect(instance.isActive.value).toBe(false);

		mountMolecule(instance);
		expect(instance.isActive.value).toBe(true);

		vi.advanceTimersByTime(40);
		expect(callback).toHaveBeenCalledTimes(2);

		unmountMolecule(instance);
		expect(instance.isActive.value).toBe(false);

		vi.advanceTimersByTime(40);
		expect(callback).toHaveBeenCalledTimes(2);
	});
});
