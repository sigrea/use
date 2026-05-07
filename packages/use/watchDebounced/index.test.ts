// @vitest-environment node

import {
	computed,
	createScope,
	deepSignal,
	disposeScope,
	nextTick,
	runWithScope,
	signal,
} from "@sigrea/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import { watchDebounced } from "./index";

describe("watchDebounced", () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it("debounces watch callback execution", () => {
		vi.useFakeTimers();
		const source = signal(0);
		const callback = vi.fn();
		const stop = watchDebounced(source, callback, {
			debounce: 20,
			flush: "sync",
		});

		source.value = 1;
		vi.advanceTimersByTime(10);
		source.value = 2;
		vi.advanceTimersByTime(19);

		expect(callback).not.toHaveBeenCalled();

		vi.advanceTimersByTime(1);

		expect(callback).toHaveBeenCalledTimes(1);
		expect(callback).toHaveBeenCalledWith(2, 1, expect.any(Function));
		stop();
	});

	it("uses maxWait to force the latest callback", () => {
		vi.useFakeTimers();
		const source = signal("initial");
		const callback = vi.fn();
		const stop = watchDebounced(source, callback, {
			debounce: 50,
			flush: "sync",
			maxWait: 100,
		});

		source.value = "first";
		vi.advanceTimersByTime(40);
		source.value = "second";
		vi.advanceTimersByTime(40);
		source.value = "third";
		vi.advanceTimersByTime(19);
		expect(callback).not.toHaveBeenCalled();

		vi.advanceTimersByTime(1);

		expect(callback).toHaveBeenCalledTimes(1);
		expect(callback).toHaveBeenCalledWith(
			"third",
			"second",
			expect.any(Function),
		);
		stop();
	});

	it("supports reactive debounce time", () => {
		vi.useFakeTimers();
		const source = signal(0);
		const delay = signal(20);
		const callback = vi.fn();
		const stop = watchDebounced(source, callback, {
			debounce: delay,
			flush: "sync",
		});

		source.value = 1;
		delay.value = 50;
		source.value = 2;
		vi.advanceTimersByTime(49);
		expect(callback).not.toHaveBeenCalled();

		vi.advanceTimersByTime(1);

		expect(callback).toHaveBeenCalledTimes(1);
		expect(callback).toHaveBeenCalledWith(2, 1, expect.any(Function));
		stop();
	});

	it("runs immediately when debounce is zero", () => {
		const source = signal(0);
		const callback = vi.fn();
		const stop = watchDebounced(source, callback, {
			debounce: 0,
			flush: "sync",
		});

		source.value = 1;

		expect(callback).toHaveBeenCalledTimes(1);
		expect(callback).toHaveBeenCalledWith(1, 0, expect.any(Function));
		stop();
	});

	it("debounces the immediate watch run", () => {
		vi.useFakeTimers();
		const source = signal(0);
		const callback = vi.fn();
		const stop = watchDebounced(source, callback, {
			debounce: 20,
			flush: "sync",
			immediate: true,
		});

		expect(callback).not.toHaveBeenCalled();

		vi.advanceTimersByTime(20);

		expect(callback).toHaveBeenCalledTimes(1);
		expect(callback).toHaveBeenCalledWith(0, undefined, expect.any(Function));
		stop();
	});

	it("cancels pending callbacks when stopped", () => {
		vi.useFakeTimers();
		const source = signal(0);
		const callback = vi.fn();
		const stop = watchDebounced(source, callback, {
			debounce: 20,
			flush: "sync",
		});

		source.value = 1;
		stop();
		vi.advanceTimersByTime(20);

		expect(callback).not.toHaveBeenCalled();
	});

	it("cancels pending callbacks when the scope is disposed", () => {
		vi.useFakeTimers();
		const scope = createScope();
		const source = signal(0);
		const callback = vi.fn();
		let stop!: () => void;

		runWithScope(scope, () => {
			stop = watchDebounced(source, callback, {
				debounce: 20,
				flush: "sync",
			});
		});

		source.value = 1;
		disposeScope(scope);
		expect(vi.getTimerCount()).toBe(0);

		vi.advanceTimersByTime(20);

		expect(callback).not.toHaveBeenCalled();
		stop();
	});

	it("keeps cleanup registered by the debounced callback", () => {
		vi.useFakeTimers();
		const source = signal(0);
		const cleanup = vi.fn();
		const callback = vi.fn((_value, _oldValue, onCleanup) => {
			onCleanup(cleanup);
		});
		const stop = watchDebounced(source, callback, {
			debounce: 20,
			flush: "sync",
		});

		source.value = 1;
		vi.advanceTimersByTime(20);
		expect(cleanup).not.toHaveBeenCalled();

		source.value = 2;

		expect(cleanup).toHaveBeenCalledTimes(1);
		stop();
	});

	it("keeps cleanup returned from the debounced callback", () => {
		vi.useFakeTimers();
		const source = signal(0);
		const cleanup = vi.fn();
		const stop = watchDebounced(source, () => cleanup, {
			debounce: 20,
			flush: "sync",
		});

		source.value = 1;
		vi.advanceTimersByTime(20);
		expect(cleanup).not.toHaveBeenCalled();

		stop();

		expect(cleanup).toHaveBeenCalledTimes(1);
	});

	it("passes deep and flush options to Sigrea watch", () => {
		vi.useFakeTimers();
		const source = deepSignal({ nested: { count: 0 } });
		const callback = vi.fn();
		const stop = watchDebounced(source, callback, {
			debounce: 20,
			deep: true,
			flush: "sync",
		});

		source.nested.count = 1;
		vi.advanceTimersByTime(20);

		expect(callback).toHaveBeenCalledTimes(1);
		expect(callback).toHaveBeenCalledWith(source, source, expect.any(Function));
		stop();
	});

	it("watches source lists", () => {
		vi.useFakeTimers();
		const left = signal(0);
		const right = computed(() => left.value * 2);
		const callback = vi.fn();
		const stop = watchDebounced([left, right] as const, callback, {
			debounce: 20,
			flush: "sync",
		});

		left.value = 1;
		left.value = 2;
		vi.advanceTimersByTime(20);

		expect(callback).toHaveBeenCalledTimes(1);
		expect(callback).toHaveBeenCalledWith([2, 4], [1, 2], expect.any(Function));
		stop();
	});

	it("uses the default pre flush timing before debounce", async () => {
		vi.useFakeTimers();
		const source = signal(0);
		const callback = vi.fn();
		const stop = watchDebounced(source, callback, { debounce: 20 });

		source.value = 1;
		vi.advanceTimersByTime(20);
		expect(callback).not.toHaveBeenCalled();

		await nextTick();
		vi.advanceTimersByTime(20);

		expect(callback).toHaveBeenCalledTimes(1);
		stop();
	});
});
