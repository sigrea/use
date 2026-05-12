// @vitest-environment node

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

import { useTimeoutPoll } from "./index";

describe("useTimeoutPoll", () => {
	afterEach(() => {
		disposeTrackedMolecules();
		vi.useRealTimers();
	});

	it("starts, pauses, and resumes a timeout poll", async () => {
		vi.useFakeTimers();
		const callback = vi.fn();
		const interval = signal(20);
		const poll = useTimeoutPoll(callback, interval, { immediate: false });

		expect(poll.isActive.value).toBe(false);

		poll.resume();
		expect(poll.isActive.value).toBe(true);

		await vi.advanceTimersByTimeAsync(19);
		expect(callback).not.toHaveBeenCalled();

		await vi.advanceTimersByTimeAsync(1);
		expect(callback).toHaveBeenCalledTimes(1);

		poll.pause();
		interval.value = 10;
		callback.mockClear();

		await vi.advanceTimersByTimeAsync(20);
		expect(callback).not.toHaveBeenCalled();

		poll.resume();
		await vi.advanceTimersByTimeAsync(9);
		expect(callback).not.toHaveBeenCalled();

		await vi.advanceTimersByTimeAsync(1);
		expect(callback).toHaveBeenCalledTimes(1);
	});

	it("waits for an immediate callback before scheduling the next timeout", async () => {
		vi.useFakeTimers();
		let finishCallback!: () => void;
		const callback = vi.fn(
			() =>
				new Promise<void>((resolve) => {
					finishCallback = resolve;
				}),
		);
		const poll = useTimeoutPoll(callback, 10, {
			immediate: false,
			immediateCallback: true,
		});

		poll.resume();
		expect(callback).toHaveBeenCalledTimes(1);

		await vi.advanceTimersByTimeAsync(100);
		expect(callback).toHaveBeenCalledTimes(1);

		finishCallback();
		await vi.advanceTimersByTimeAsync(0);
		await vi.advanceTimersByTimeAsync(9);
		expect(callback).toHaveBeenCalledTimes(1);

		await vi.advanceTimersByTimeAsync(1);
		expect(callback).toHaveBeenCalledTimes(2);

		poll.pause();
	});

	it("does not schedule another timeout when paused during the callback", async () => {
		vi.useFakeTimers();
		let finishCallback!: () => void;
		const callback = vi.fn(
			() =>
				new Promise<void>((resolve) => {
					finishCallback = resolve;
				}),
		);
		const poll = useTimeoutPoll(callback, 10, {
			immediateCallback: true,
		});

		expect(callback).toHaveBeenCalledTimes(1);

		poll.pause();
		finishCallback();
		await vi.advanceTimersByTimeAsync(100);

		expect(callback).toHaveBeenCalledTimes(1);
		expect(poll.isActive.value).toBe(false);
	});

	it("cleans up with scope disposal", async () => {
		vi.useFakeTimers();
		const callback = vi.fn();
		const scope = createScope();
		let poll!: ReturnType<typeof useTimeoutPoll>;

		runWithScope(scope, () => {
			poll = useTimeoutPoll(callback, 10, { immediate: true });
			expect(poll.isActive.value).toBe(true);
		});

		disposeScope(scope);
		expect(poll.isActive.value).toBe(false);

		await vi.advanceTimersByTimeAsync(10);
		expect(callback).not.toHaveBeenCalled();
	});

	it("starts on molecule mount and pauses on unmount", async () => {
		vi.useFakeTimers();
		const callback = vi.fn();
		const PollMolecule = molecule(() =>
			useTimeoutPoll(callback, 10, { immediate: true }),
		);
		const instance = PollMolecule();
		trackMolecule(instance);

		await vi.advanceTimersByTimeAsync(10);
		expect(callback).not.toHaveBeenCalled();
		expect(instance.isActive.value).toBe(false);

		mountMolecule(instance);
		expect(instance.isActive.value).toBe(true);

		await vi.advanceTimersByTimeAsync(10);
		expect(callback).toHaveBeenCalledTimes(1);

		unmountMolecule(instance);
		expect(instance.isActive.value).toBe(false);

		await vi.advanceTimersByTimeAsync(10);
		expect(callback).toHaveBeenCalledTimes(1);
	});
});
