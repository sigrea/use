// @vitest-environment node

import { computed, deepSignal, nextTick, signal } from "@sigrea/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import { watchAtMost } from "./index";

describe("watchAtMost", () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it("runs the callback at most the configured count", async () => {
		const source = signal(0);
		const callback = vi.fn();
		const controls = watchAtMost(source, callback, { count: 2 });

		source.value = 1;
		await nextTick();
		source.value = 2;
		await nextTick();
		source.value = 3;
		await nextTick();

		expect(callback).toHaveBeenCalledTimes(2);
		expect(controls.count.value).toBe(2);
		controls.stop();
	});

	it("does not exceed the count with sync flushing", () => {
		const source = signal(0);
		const callback = vi.fn();
		const controls = watchAtMost(source, callback, {
			count: 2,
			flush: "sync",
		});

		source.value = 1;
		source.value = 2;
		source.value = 3;

		expect(callback).toHaveBeenCalledTimes(2);
		expect(controls.count.value).toBe(2);
	});

	it("counts the immediate run", () => {
		const source = signal(0);
		const callback = vi.fn();
		const controls = watchAtMost(source, callback, {
			count: 1,
			flush: "sync",
			immediate: true,
		});

		source.value = 1;

		expect(callback).toHaveBeenCalledTimes(1);
		expect(callback).toHaveBeenCalledWith(0, undefined, expect.any(Function));
		expect(controls.count.value).toBe(1);
	});

	it("runs cleanup when the automatic stop is applied", async () => {
		const source = signal(0);
		const cleanup = vi.fn();
		const callback = vi.fn((_value, _oldValue, onCleanup) => {
			onCleanup(cleanup);
		});
		const controls = watchAtMost(source, callback, {
			count: 1,
			flush: "sync",
		});

		source.value = 1;
		expect(cleanup).not.toHaveBeenCalled();

		await nextTick();

		expect(cleanup).toHaveBeenCalledTimes(1);
		expect(controls.count.value).toBe(1);
	});

	it("runs cleanup returned from the callback", async () => {
		const source = signal(0);
		const cleanup = vi.fn();
		const controls = watchAtMost(source, () => cleanup, {
			count: 1,
			flush: "sync",
		});

		source.value = 1;
		await nextTick();

		expect(cleanup).toHaveBeenCalledTimes(1);
		controls.stop();
	});

	it("uses a reactive count limit", () => {
		const source = signal(0);
		const limit = signal(2);
		const callback = vi.fn();
		const controls = watchAtMost(source, callback, {
			count: limit,
			flush: "sync",
		});

		source.value = 1;
		limit.value = 3;
		source.value = 2;
		source.value = 3;
		source.value = 4;

		expect(callback).toHaveBeenCalledTimes(3);
		expect(controls.count.value).toBe(3);
	});

	it("stops before the callback when a reactive count is lowered", async () => {
		const source = signal(0);
		const limit = signal(3);
		const callback = vi.fn();
		const controls = watchAtMost(source, callback, {
			count: limit,
			flush: "sync",
		});

		source.value = 1;
		source.value = 2;
		limit.value = 1;
		source.value = 3;
		await nextTick();
		source.value = 4;

		expect(callback).toHaveBeenCalledTimes(2);
		expect(controls.count.value).toBe(2);
	});

	it("does not run when count is zero or lower", () => {
		const source = signal(0);
		const callback = vi.fn();
		let reads = 0;
		const zeroControls = watchAtMost(source, callback, {
			count: 0,
			flush: "sync",
			immediate: true,
		});
		const negativeControls = watchAtMost(source, callback, {
			count: -1,
			flush: "sync",
		});
		watchAtMost(
			() => {
				reads += 1;
				return source.value;
			},
			callback,
			{
				count: 0,
				flush: "sync",
			},
		);

		source.value = 1;

		expect(callback).not.toHaveBeenCalled();
		expect(zeroControls.count.value).toBe(0);
		expect(negativeControls.count.value).toBe(0);
		expect(reads).toBe(1);
	});

	it("does not run when count is NaN", () => {
		const source = signal(0);
		const callback = vi.fn();
		const controls = watchAtMost(source, callback, {
			count: Number.NaN,
			flush: "sync",
			immediate: true,
		});

		source.value = 1;

		expect(callback).not.toHaveBeenCalled();
		expect(controls.count.value).toBe(0);
	});

	it("floors finite count values", () => {
		const source = signal(0);
		const callback = vi.fn();
		const controls = watchAtMost(source, callback, {
			count: 1.8,
			flush: "sync",
		});

		source.value = 1;
		source.value = 2;

		expect(callback).toHaveBeenCalledTimes(1);
		expect(controls.count.value).toBe(1);
	});

	it("does not stop automatically when count is Infinity", () => {
		const source = signal(0);
		const callback = vi.fn();
		const controls = watchAtMost(source, callback, {
			count: Number.POSITIVE_INFINITY,
			flush: "sync",
		});

		source.value = 1;
		source.value = 2;
		source.value = 3;

		expect(callback).toHaveBeenCalledTimes(3);
		expect(controls.count.value).toBe(3);
		controls.stop();
		source.value = 4;
		expect(callback).toHaveBeenCalledTimes(3);
	});

	it("passes deep and flush options to Sigrea watch", () => {
		const source = deepSignal({ nested: { count: 0 } });
		const callback = vi.fn();
		const controls = watchAtMost(source, callback, {
			count: 1,
			deep: true,
			flush: "sync",
		});

		source.nested.count = 1;

		expect(callback).toHaveBeenCalledTimes(1);
		expect(callback).toHaveBeenCalledWith(source, source, expect.any(Function));
		expect(controls.count.value).toBe(1);
	});

	it("watches source lists", () => {
		const left = signal(0);
		const right = computed(() => left.value * 2);
		const callback = vi.fn();
		const controls = watchAtMost([left, right] as const, callback, {
			count: 1,
			flush: "sync",
		});

		left.value = 1;
		left.value = 2;

		expect(callback).toHaveBeenCalledTimes(1);
		expect(callback).toHaveBeenCalledWith([1, 2], [0, 0], expect.any(Function));
		expect(controls.count.value).toBe(1);
	});
});
