import {
	disposeTrackedMolecules,
	isDeepSignal,
	nextTick,
	readonly,
	signal,
} from "@sigrea/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useThrottledRefHistory } from "./index";

describe("useThrottledRefHistory", () => {
	afterEach(() => {
		disposeTrackedMolecules();
		vi.useRealTimers();
	});

	it("commits the first source change immediately and the latest trailing change after the throttle delay", async () => {
		vi.useFakeTimers();
		const source = signal(0);
		const history = useThrottledRefHistory(source, { throttle: 10 });

		expect(history.history.value.map((record) => record.snapshot)).toEqual([0]);

		source.value = 100;
		await nextTick();

		expect(history.history.value.map((record) => record.snapshot)).toEqual([
			100, 0,
		]);

		source.value = 200;
		source.value = 300;
		source.value = 400;
		await nextTick();

		expect(history.history.value.map((record) => record.snapshot)).toEqual([
			100, 0,
		]);

		vi.advanceTimersByTime(9);
		expect(history.history.value.map((record) => record.snapshot)).toEqual([
			100, 0,
		]);

		vi.advanceTimersByTime(1);
		expect(history.history.value.map((record) => record.snapshot)).toEqual([
			400, 100, 0,
		]);
	});

	it("drops changes inside the throttle window when trailing is false", async () => {
		vi.useFakeTimers();
		const source = signal(0);
		const history = useThrottledRefHistory(source, {
			throttle: 20,
			trailing: false,
		});

		source.value = 1;
		await nextTick();
		source.value = 2;
		await nextTick();
		vi.advanceTimersByTime(20);

		expect(history.history.value.map((record) => record.snapshot)).toEqual([
			1, 0,
		]);

		source.value = 3;
		await nextTick();

		expect(history.history.value.map((record) => record.snapshot)).toEqual([
			3, 1, 0,
		]);
	});

	it("commits sync changes immediately when the throttle delay is zero", () => {
		const source = signal(0);
		const history = useThrottledRefHistory(source, {
			flush: "sync",
			throttle: 0,
		});

		source.value = 1;
		source.value = 2;

		expect(history.history.value.map((record) => record.snapshot)).toEqual([
			2, 1, 0,
		]);
	});

	it("uses reactive throttle delays when scheduling", async () => {
		vi.useFakeTimers();
		const source = signal(0);
		const delay = signal(10);
		const history = useThrottledRefHistory(source, {
			throttle: readonly(delay),
		});

		source.value = 1;
		await nextTick();
		delay.value = 20;
		source.value = 2;
		await nextTick();

		vi.advanceTimersByTime(19);
		expect(history.history.value.map((record) => record.snapshot)).toEqual([
			1, 0,
		]);

		vi.advanceTimersByTime(1);
		expect(history.history.value.map((record) => record.snapshot)).toEqual([
			2, 1, 0,
		]);
	});

	it("keeps manual commits immediate and clears pending trailing commits", async () => {
		vi.useFakeTimers();
		const source = signal(0);
		const history = useThrottledRefHistory(source, { throttle: 20 });

		source.value = 1;
		await nextTick();
		source.value = 2;
		await nextTick();
		history.commit();

		expect(history.history.value.map((record) => record.snapshot)).toEqual([
			2, 1, 0,
		]);

		vi.advanceTimersByTime(20);
		expect(history.history.value.map((record) => record.snapshot)).toEqual([
			2, 1, 0,
		]);
	});

	it("clears pending automatic commits when pause is called", async () => {
		vi.useFakeTimers();
		const source = signal(0);
		const history = useThrottledRefHistory(source, { throttle: 20 });

		source.value = 1;
		await nextTick();
		source.value = 2;
		await nextTick();
		history.pause();
		vi.advanceTimersByTime(20);

		expect(history.isTracking.value).toBe(false);
		expect(history.history.value.map((record) => record.snapshot)).toEqual([
			1, 0,
		]);
	});

	it("keeps resume commit immediate", async () => {
		vi.useFakeTimers();
		const source = signal(0);
		const history = useThrottledRefHistory(source, { throttle: 20 });

		history.pause();
		source.value = 1;
		await nextTick();
		history.resume(true);

		expect(history.isTracking.value).toBe(true);
		expect(history.history.value.map((record) => record.snapshot)).toEqual([
			1, 0,
		]);

		vi.advanceTimersByTime(20);
		expect(history.history.value.map((record) => record.snapshot)).toEqual([
			1, 0,
		]);
	});

	it("cancels pending automatic commits when undoing", async () => {
		vi.useFakeTimers();
		const source = signal(0);
		const history = useThrottledRefHistory(source, { throttle: 20 });

		source.value = 1;
		await nextTick();
		source.value = 2;
		await nextTick();
		history.undo();
		vi.advanceTimersByTime(20);

		expect(source.value).toBe(0);
		expect(history.history.value.map((record) => record.snapshot)).toEqual([0]);
		expect(history.redoStack.value.map((record) => record.snapshot)).toEqual([
			1,
		]);
	});

	it("cancels pending automatic commits when clearing history", async () => {
		vi.useFakeTimers();
		const source = signal(0);
		const history = useThrottledRefHistory(source, { throttle: 20 });

		source.value = 1;
		await nextTick();
		source.value = 2;
		await nextTick();
		history.clear();
		vi.advanceTimersByTime(20);

		expect(history.history.value.map((record) => record.snapshot)).toEqual([1]);
	});

	it("cancels pending automatic commits when resetting history", async () => {
		vi.useFakeTimers();
		const source = signal(0);
		const history = useThrottledRefHistory(source, { throttle: 20 });

		source.value = 1;
		await nextTick();

		source.value = 2;
		await nextTick();
		history.reset();
		vi.advanceTimersByTime(20);

		expect(source.value).toBe(1);
		expect(history.history.value.map((record) => record.snapshot)).toEqual([
			1, 0,
		]);
	});

	it("cancels pending automatic commits when redoing", async () => {
		vi.useFakeTimers();
		const source = signal(0);
		const history = useThrottledRefHistory(source, { throttle: 20 });

		source.value = 1;
		await nextTick();
		history.undo();
		history.redo();
		source.value = 2;
		await nextTick();
		history.undo();
		history.redo();
		vi.advanceTimersByTime(20);

		expect(source.value).toBe(1);
		expect(history.history.value.map((record) => record.snapshot)).toEqual([
			1, 0,
		]);
		expect(history.redoStack.value).toEqual([]);
	});

	it("drops pending automatic commits when disposed", async () => {
		vi.useFakeTimers();
		const source = signal(0);
		const history = useThrottledRefHistory(source, { throttle: 20 });

		source.value = 1;
		await nextTick();
		source.value = 2;
		await nextTick();
		history.dispose();
		vi.advanceTimersByTime(20);

		expect(history.isTracking.value).toBe(false);
		expect(history.history.value.map((record) => record.snapshot)).toEqual([1]);
	});

	it("keeps deep tracking after throttled commits and undo", async () => {
		vi.useFakeTimers();
		const source = signal({ nested: { count: 0 } });
		const history = useThrottledRefHistory(source, {
			deep: true,
			flush: "sync",
			throttle: 10,
		});

		expect(isDeepSignal(source.value)).toBe(true);

		source.value.nested.count = 1;
		vi.advanceTimersByTime(10);

		expect(history.history.value.map((record) => record.snapshot)).toEqual([
			{ nested: { count: 1 } },
			{ nested: { count: 0 } },
		]);
		expect(isDeepSignal(history.history.value[0].snapshot)).toBe(false);

		history.undo();
		expect(source.value).toEqual({ nested: { count: 0 } });
		expect(isDeepSignal(source.value)).toBe(true);

		source.value.nested.count = 2;
		vi.advanceTimersByTime(10);

		expect(history.history.value.map((record) => record.snapshot)).toEqual([
			{ nested: { count: 2 } },
			{ nested: { count: 0 } },
		]);
	});

	it("respects shouldCommit after the throttle delay", async () => {
		vi.useFakeTimers();
		const source = signal(0);
		const calls: Array<[number | undefined, number]> = [];
		const history = useThrottledRefHistory(source, {
			shouldCommit: (oldValue, newValue) => {
				calls.push([oldValue, newValue]);
				return newValue > 0;
			},
			throttle: 10,
		});

		source.value = -1;
		await nextTick();

		expect(history.history.value.map((record) => record.snapshot)).toEqual([0]);
		expect(calls).toEqual([[0, -1]]);

		source.value = 2;
		await nextTick();
		vi.advanceTimersByTime(10);

		expect(history.history.value.map((record) => record.snapshot)).toEqual([
			2, 0,
		]);
		expect(calls).toEqual([
			[0, -1],
			[0, 2],
		]);
	});
});
