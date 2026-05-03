import {
	createScope,
	disposeScope,
	disposeTrackedMolecules,
	molecule,
	mountMolecule,
	runWithScope,
	signal,
	trackMolecule,
	unmountMolecule,
} from "@sigrea/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useIntervalFn } from "../useIntervalFn";
import { useTimeoutFn } from "../useTimeoutFn";

describe("timer composables", () => {
	afterEach(() => {
		disposeTrackedMolecules();
		vi.useRealTimers();
	});

	it("runs and stops a timeout", () => {
		vi.useFakeTimers();
		const callback = vi.fn();
		const delay = signal(50);
		const timeout = useTimeoutFn(callback, delay);

		timeout.start();
		expect(timeout.isPending.value).toBe(true);

		vi.advanceTimersByTime(49);
		expect(callback).not.toHaveBeenCalled();

		vi.advanceTimersByTime(1);
		expect(callback).toHaveBeenCalledTimes(1);
		expect(timeout.isPending.value).toBe(false);

		timeout.start();
		timeout.stop();
		vi.runAllTimers();
		expect(callback).toHaveBeenCalledTimes(1);
	});

	it("can invoke the timeout callback immediately before waiting", () => {
		vi.useFakeTimers();
		const callback = vi.fn();
		const timeout = useTimeoutFn(callback, 50, {
			immediateCallback: true,
		});

		timeout.start();
		expect(callback).toHaveBeenCalledTimes(1);
		expect(timeout.isPending.value).toBe(true);

		vi.advanceTimersByTime(50);
		expect(callback).toHaveBeenCalledTimes(2);
		expect(timeout.isPending.value).toBe(false);
	});

	it("does not keep the timeout running when immediateCallback stops it", () => {
		vi.useFakeTimers();
		let timeout!: ReturnType<typeof useTimeoutFn>;
		const callback = vi.fn(() => {
			timeout.stop();
		});
		const TimeoutMolecule = molecule(() => {
			timeout = useTimeoutFn(callback, 50, {
				immediate: true,
				immediateCallback: true,
			});
			return timeout;
		});
		const instance = TimeoutMolecule();
		trackMolecule(instance);

		mountMolecule(instance);
		expect(callback).toHaveBeenCalledTimes(1);
		expect(instance.isPending.value).toBe(false);

		vi.advanceTimersByTime(100);
		expect(callback).toHaveBeenCalledTimes(1);
	});

	it("cleans up a timeout with scope disposal", () => {
		vi.useFakeTimers();
		const callback = vi.fn();
		const scope = createScope();

		runWithScope(scope, () => {
			const timeout = useTimeoutFn(callback, 10, { immediate: true });
			expect(timeout.isPending.value).toBe(true);
		});

		disposeScope(scope);
		vi.runAllTimers();
		expect(callback).not.toHaveBeenCalled();
	});

	it("starts an immediate timeout on molecule mount", () => {
		vi.useFakeTimers();
		const callback = vi.fn();
		const TimeoutMolecule = molecule(() =>
			useTimeoutFn(callback, 10, { immediate: true }),
		);
		const instance = TimeoutMolecule();
		trackMolecule(instance);

		vi.advanceTimersByTime(10);
		expect(callback).not.toHaveBeenCalled();
		expect(instance.isPending.value).toBe(false);

		mountMolecule(instance);
		expect(instance.isPending.value).toBe(true);

		vi.advanceTimersByTime(10);
		expect(callback).toHaveBeenCalledTimes(1);
		expect(instance.isPending.value).toBe(false);
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

	it("does not keep the interval running when immediateCallback pauses it", () => {
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
