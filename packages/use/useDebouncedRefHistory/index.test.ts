import {
	disposeTrackedMolecules,
	isDeepSignal,
	nextTick,
	readonly,
	signal,
} from "@sigrea/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useDebouncedRefHistory } from "./index";

describe("useDebouncedRefHistory", () => {
	afterEach(() => {
		disposeTrackedMolecules();
		vi.useRealTimers();
	});

	it("commits source changes after the debounce delay", async () => {
		vi.useFakeTimers();
		const source = signal(0);
		const history = useDebouncedRefHistory(source, { debounce: 10 });

		source.value = 100;
		await nextTick();

		expect(history.history.value.map((record) => record.snapshot)).toEqual([0]);

		vi.advanceTimersByTime(9);
		expect(history.history.value.map((record) => record.snapshot)).toEqual([0]);

		vi.advanceTimersByTime(1);
		expect(history.history.value.map((record) => record.snapshot)).toEqual([
			100, 0,
		]);
	});

	it("uses the latest value when changes happen within the debounce delay", async () => {
		vi.useFakeTimers();
		const source = signal(0);
		const history = useDebouncedRefHistory(source, { debounce: 20 });

		source.value = 1;
		await nextTick();
		vi.advanceTimersByTime(10);

		source.value = 2;
		await nextTick();
		vi.advanceTimersByTime(20);

		expect(history.history.value.map((record) => record.snapshot)).toEqual([
			2, 0,
		]);
	});

	it("reschedules when the source returns to the last committed value", async () => {
		vi.useFakeTimers();
		const source = signal(0);
		const history = useDebouncedRefHistory(source, { debounce: 50 });

		source.value = 1;
		await nextTick();
		vi.advanceTimersByTime(30);

		source.value = 0;
		await nextTick();
		vi.advanceTimersByTime(30);

		expect(history.history.value.map((record) => record.snapshot)).toEqual([0]);

		source.value = 2;
		await nextTick();
		vi.advanceTimersByTime(49);
		expect(history.history.value.map((record) => record.snapshot)).toEqual([0]);

		vi.advanceTimersByTime(1);
		expect(history.history.value.map((record) => record.snapshot)).toEqual([
			2, 0,
		]);
	});

	it("commits immediately when debounce is undefined", async () => {
		const source = signal(0);
		const history = useDebouncedRefHistory(source, { deep: false });

		source.value = 100;
		await nextTick();

		expect(history.history.value.map((record) => record.snapshot)).toEqual([
			100, 0,
		]);
	});

	it("supports signal debounce delays", async () => {
		vi.useFakeTimers();
		const source = signal(0);
		const delay = signal(10);
		const history = useDebouncedRefHistory(source, {
			debounce: readonly(delay),
		});

		source.value = 1;
		await nextTick();
		delay.value = 20;
		source.value = 2;
		await nextTick();

		vi.advanceTimersByTime(19);
		expect(history.history.value.map((record) => record.snapshot)).toEqual([0]);

		vi.advanceTimersByTime(1);
		expect(history.history.value.map((record) => record.snapshot)).toEqual([
			2, 0,
		]);
	});

	it("keeps manual commits immediate", async () => {
		vi.useFakeTimers();
		const source = signal(0);
		const history = useDebouncedRefHistory(source, { debounce: 20 });

		source.value = 1;
		await nextTick();
		history.commit();

		expect(history.history.value.map((record) => record.snapshot)).toEqual([
			1, 0,
		]);

		vi.advanceTimersByTime(20);
		expect(history.history.value.map((record) => record.snapshot)).toEqual([
			1, 0,
		]);
	});

	it("respects shouldCommit after the debounce delay", async () => {
		vi.useFakeTimers();
		const source = signal(0);
		const calls: Array<[number | undefined, number]> = [];
		const history = useDebouncedRefHistory(source, {
			debounce: 10,
			shouldCommit: (oldValue, newValue) => {
				calls.push([oldValue, newValue]);
				return newValue > 0;
			},
		});

		source.value = -1;
		await nextTick();
		vi.advanceTimersByTime(10);

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

	it("commits sync changes immediately when the debounce delay is zero", () => {
		const source = signal(0);
		const history = useDebouncedRefHistory(source, {
			debounce: 0,
			flush: "sync",
		});

		source.value = 1;
		expect(history.history.value.map((record) => record.snapshot)).toEqual([
			1, 0,
		]);

		source.value = 2;
		expect(history.history.value.map((record) => record.snapshot)).toEqual([
			2, 1, 0,
		]);
	});

	it("debounces deep mutations and keeps deep tracking after undo", async () => {
		vi.useFakeTimers();
		const source = signal({ nested: { count: 0 } });
		const history = useDebouncedRefHistory(source, {
			debounce: 10,
			deep: true,
			flush: "sync",
		});

		expect(isDeepSignal(source.value)).toBe(true);

		source.value.nested.count = 1;
		await nextTick();
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
		await nextTick();
		vi.advanceTimersByTime(10);

		expect(history.history.value.map((record) => record.snapshot)).toEqual([
			{ nested: { count: 2 } },
			{ nested: { count: 0 } },
		]);
		expect(history.redoStack.value).toEqual([]);
	});

	it("passes dump parse and capacity options through debounced commits", async () => {
		vi.useFakeTimers();
		const source = signal({ nested: { count: 0 } });
		const history = useDebouncedRefHistory(source, {
			capacity: 1,
			debounce: 10,
			deep: true,
			dump: JSON.stringify,
			parse: (value: string) =>
				JSON.parse(value) as { nested: { count: number } },
		});

		source.value.nested.count = 1;
		await nextTick();
		vi.advanceTimersByTime(10);

		source.value.nested.count = 2;
		await nextTick();
		vi.advanceTimersByTime(10);

		expect(history.history.value.map((record) => record.snapshot)).toEqual([
			'{"nested":{"count":2}}',
			'{"nested":{"count":1}}',
		]);

		history.undo();

		expect(source.value).toEqual({ nested: { count: 1 } });
		expect(isDeepSignal(source.value)).toBe(true);
		expect(history.redoStack.value.map((record) => record.snapshot)).toEqual([
			'{"nested":{"count":2}}',
		]);
	});

	it("does not keep a pending automatic commit after pause", async () => {
		vi.useFakeTimers();
		const source = signal(0);
		const history = useDebouncedRefHistory(source, { debounce: 20 });

		source.value = 1;
		await nextTick();
		history.pause();
		vi.advanceTimersByTime(20);

		expect(history.isTracking.value).toBe(false);
		expect(history.history.value.map((record) => record.snapshot)).toEqual([0]);

		source.value = 2;
		await nextTick();
		vi.advanceTimersByTime(20);
		expect(history.history.value.map((record) => record.snapshot)).toEqual([0]);
	});

	it("keeps resume commit immediate", async () => {
		vi.useFakeTimers();
		const source = signal(0);
		const history = useDebouncedRefHistory(source, { debounce: 20 });

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
		const history = useDebouncedRefHistory(source, { debounce: 20 });

		source.value = 1;
		await nextTick();
		history.commit();
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

	it("drops pending automatic commits when disposed", async () => {
		vi.useFakeTimers();
		const source = signal(0);
		const history = useDebouncedRefHistory(source, { debounce: 20 });

		source.value = 1;
		await nextTick();
		history.dispose();
		vi.advanceTimersByTime(20);

		expect(history.isTracking.value).toBe(false);
		expect(history.history.value.map((record) => record.snapshot)).toEqual([0]);
	});
});
