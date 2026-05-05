import {
	createScope,
	disposeScope,
	disposeTrackedMolecules,
	molecule,
	mountMolecule,
	runWithScope,
	signal,
	trackMolecule,
} from "@sigrea/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useCountdown } from "./index";

describe("useCountdown", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
		disposeTrackedMolecules();
	});

	it("starts paused by default", () => {
		const countdown = useCountdown(3);

		expect(countdown.remaining.value).toBe(3);
		expect(countdown.isActive.value).toBe(false);

		vi.advanceTimersByTime(1000);

		expect(countdown.remaining.value).toBe(3);
	});

	it("starts immediately when requested", () => {
		const countdown = useCountdown(2, { immediate: true });

		expect(countdown.isActive.value).toBe(true);

		vi.advanceTimersByTime(1000);

		expect(countdown.remaining.value).toBe(1);
	});

	it("waits for molecule mount before immediate start", () => {
		const CountdownMolecule = molecule(() =>
			useCountdown(2, {
				immediate: true,
				interval: 10,
			}),
		);
		const countdown = CountdownMolecule();
		trackMolecule(countdown);

		expect(countdown.isActive.value).toBe(false);
		vi.advanceTimersByTime(10);
		expect(countdown.remaining.value).toBe(2);

		mountMolecule(countdown);

		expect(countdown.isActive.value).toBe(true);
		vi.advanceTimersByTime(10);
		expect(countdown.remaining.value).toBe(1);
	});

	it("ticks down to zero and completes once", () => {
		const onTick = vi.fn();
		const onComplete = vi.fn();
		const countdown = useCountdown(2, {
			immediate: true,
			onComplete,
			onTick,
		});

		vi.advanceTimersByTime(1000);

		expect(countdown.remaining.value).toBe(1);
		expect(onTick).toHaveBeenLastCalledWith(1);
		expect(onComplete).not.toHaveBeenCalled();

		vi.advanceTimersByTime(1000);

		expect(countdown.remaining.value).toBe(0);
		expect(countdown.isActive.value).toBe(false);
		expect(onTick).toHaveBeenLastCalledWith(0);
		expect(onTick).toHaveBeenCalledTimes(2);
		expect(onComplete).toHaveBeenCalledTimes(1);

		vi.advanceTimersByTime(1000);

		expect(onTick).toHaveBeenCalledTimes(2);
		expect(onComplete).toHaveBeenCalledTimes(1);
	});

	it("pauses and resumes without resetting the remaining value", () => {
		const countdown = useCountdown(3, { immediate: true });

		vi.advanceTimersByTime(1000);
		countdown.pause();

		expect(countdown.remaining.value).toBe(2);
		expect(countdown.isActive.value).toBe(false);

		vi.advanceTimersByTime(1000);

		expect(countdown.remaining.value).toBe(2);

		countdown.resume();
		vi.advanceTimersByTime(1000);

		expect(countdown.remaining.value).toBe(1);
	});

	it("cleans up active countdown with scope disposal", () => {
		const onTick = vi.fn();
		const scope = createScope();
		let countdown!: ReturnType<typeof useCountdown>;

		runWithScope(scope, () => {
			countdown = useCountdown(3, {
				immediate: true,
				interval: 10,
				onTick,
			});
		});

		vi.advanceTimersByTime(10);

		expect(countdown.remaining.value).toBe(2);
		expect(onTick).toHaveBeenCalledTimes(1);

		disposeScope(scope);
		vi.advanceTimersByTime(50);

		expect(countdown.isActive.value).toBe(false);
		expect(countdown.remaining.value).toBe(2);
		expect(onTick).toHaveBeenCalledTimes(1);
	});

	it("does not resume a completed countdown", () => {
		const countdown = useCountdown(0);

		countdown.resume();

		expect(countdown.isActive.value).toBe(false);
	});

	it("stops and resets to the latest initial value", () => {
		const initial = signal(3);
		const countdown = useCountdown(initial, { immediate: true });

		vi.advanceTimersByTime(1000);
		initial.value = 5;
		countdown.stop();

		expect(countdown.isActive.value).toBe(false);
		expect(countdown.remaining.value).toBe(5);
	});

	it("resets without changing the active timer state", () => {
		const countdown = useCountdown(3, { immediate: true });

		vi.advanceTimersByTime(1000);
		countdown.reset(4);

		expect(countdown.isActive.value).toBe(true);
		expect(countdown.remaining.value).toBe(4);

		vi.advanceTimersByTime(1000);

		expect(countdown.remaining.value).toBe(3);
	});

	it("does not start when reset while paused", () => {
		const countdown = useCountdown(3);

		countdown.reset(2);
		vi.advanceTimersByTime(1000);

		expect(countdown.isActive.value).toBe(false);
		expect(countdown.remaining.value).toBe(2);
	});

	it("starts from a provided value", () => {
		const countdown = useCountdown(3);

		countdown.start(1);
		vi.advanceTimersByTime(1000);

		expect(countdown.remaining.value).toBe(0);
		expect(countdown.isActive.value).toBe(false);
	});

	it("does not start when the countdown is zero", () => {
		const countdown = useCountdown(3);

		countdown.start(0);

		expect(countdown.remaining.value).toBe(0);
		expect(countdown.isActive.value).toBe(false);
	});

	it("restarts the active interval when start is called", () => {
		const countdown = useCountdown(5, {
			immediate: true,
			interval: 1000,
		});

		vi.advanceTimersByTime(500);
		countdown.start(3);
		vi.advanceTimersByTime(500);

		expect(countdown.remaining.value).toBe(3);

		vi.advanceTimersByTime(500);

		expect(countdown.remaining.value).toBe(2);
	});

	it("does not start immediately when countdown is zero", () => {
		const countdown = useCountdown(0, { immediate: true });

		expect(countdown.remaining.value).toBe(0);
		expect(countdown.isActive.value).toBe(false);
	});

	it("uses reactive interval values", () => {
		const interval = signal(1000);
		const countdown = useCountdown(3, {
			immediate: true,
			interval,
		});

		interval.value = 500;
		vi.advanceTimersByTime(500);

		expect(countdown.remaining.value).toBe(2);
	});

	it("does not start when interval is not positive", () => {
		const countdown = useCountdown(3, {
			immediate: true,
			interval: 0,
		});

		expect(countdown.isActive.value).toBe(false);

		vi.advanceTimersByTime(1000);

		expect(countdown.remaining.value).toBe(3);
	});

	it("uses a custom scheduler", () => {
		const isActive = signal(false);
		let tick: (() => void) | undefined;
		const countdown = useCountdown(2, {
			scheduler(callback) {
				tick = callback;
				return {
					isActive,
					pause() {
						isActive.value = false;
					},
					resume() {
						isActive.value = true;
					},
				};
			},
		});

		countdown.start();
		tick?.();

		expect(countdown.remaining.value).toBe(1);
		expect(countdown.isActive.value).toBe(true);

		tick?.();

		expect(countdown.remaining.value).toBe(0);
		expect(countdown.isActive.value).toBe(false);
	});

	it("pauses after a scheduler ticks synchronously during setup", () => {
		const onTick = vi.fn();
		const onComplete = vi.fn();
		const isActive = signal(true);
		let tick: (() => void) | undefined;
		const countdown = useCountdown(1, {
			onComplete,
			onTick,
			scheduler(callback) {
				tick = callback;
				callback();
				return {
					isActive,
					pause() {
						isActive.value = false;
					},
					resume() {
						isActive.value = true;
					},
				};
			},
		});

		expect(countdown.remaining.value).toBe(0);
		expect(countdown.isActive.value).toBe(false);
		expect(onTick).toHaveBeenCalledTimes(1);
		expect(onComplete).toHaveBeenCalledTimes(1);

		tick?.();

		expect(onTick).toHaveBeenCalledTimes(1);
		expect(onComplete).toHaveBeenCalledTimes(1);
	});
});
