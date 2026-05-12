// @vitest-environment node

import { computed, deepSignal, nextTick, signal } from "@sigrea/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import { watchDeep } from "./index";

describe("watchDeep", () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it("watches nested deep-signal changes", () => {
		const source = deepSignal({ nested: { count: 0 } });
		const callback = vi.fn();
		const stop = watchDeep(source, callback, { flush: "sync" });

		source.nested.count = 1;

		expect(callback).toHaveBeenCalled();
		expect(callback).toHaveBeenLastCalledWith(
			source,
			source,
			expect.any(Function),
		);
		stop();
	});

	it("passes immediate and flush options to Sigrea watch", () => {
		const source = deepSignal({ count: 0 });
		const callback = vi.fn();
		const stop = watchDeep(source, callback, {
			flush: "sync",
			immediate: true,
		});

		expect(callback).toHaveBeenCalledTimes(1);
		expect(callback).toHaveBeenCalledWith(
			source,
			undefined,
			expect.any(Function),
		);
		stop();
	});

	it("watches nested values returned by a getter", () => {
		const source = signal({ nested: { count: 0 } });
		const callback = vi.fn();
		const stop = watchDeep(() => source.value, callback, { flush: "sync" });

		source.value = { nested: { count: 1 } };

		expect(callback).toHaveBeenCalledTimes(1);
		expect(callback).toHaveBeenCalledWith(
			source.value,
			{ nested: { count: 0 } },
			expect.any(Function),
		);
		stop();
	});

	it("watches source lists deeply", () => {
		const left = deepSignal({ count: 0 });
		const right = computed(() => left.count * 2);
		const callback = vi.fn();
		const stop = watchDeep([left, right] as const, callback, { flush: "sync" });

		left.count = 1;

		expect(callback).toHaveBeenCalled();
		expect(callback).toHaveBeenLastCalledWith(
			[left, 2],
			[left, 2],
			expect.any(Function),
		);
		stop();
	});

	it("uses the default pre flush timing", async () => {
		const source = deepSignal({ count: 0 });
		const callback = vi.fn();
		const stop = watchDeep(source, callback);

		source.count = 1;
		expect(callback).not.toHaveBeenCalled();

		await nextTick();

		expect(callback).toHaveBeenCalledTimes(1);
		stop();
	});

	it("runs cleanup registered by the callback on the next change", () => {
		const source = signal(0);
		const cleanup = vi.fn();
		const callback = vi.fn((_value, _oldValue, onCleanup) => {
			onCleanup(cleanup);
		});
		const stop = watchDeep(source, callback, { flush: "sync" });

		source.value = 1;
		expect(cleanup).not.toHaveBeenCalled();

		source.value = 2;
		expect(cleanup).toHaveBeenCalledTimes(1);

		stop();
		expect(cleanup).toHaveBeenCalledTimes(2);
	});

	it("runs cleanup returned from the callback on stop", () => {
		const source = signal(0);
		const returnedCleanup = vi.fn();
		const stop = watchDeep(source, () => returnedCleanup, { flush: "sync" });

		source.value = 1;
		expect(returnedCleanup).not.toHaveBeenCalled();

		stop();
		expect(returnedCleanup).toHaveBeenCalledTimes(1);
	});

	it("stops watching changes", () => {
		const source = deepSignal({ count: 0 });
		const callback = vi.fn();
		const stop = watchDeep(source, callback, { flush: "sync" });

		stop();
		source.count = 1;

		expect(callback).not.toHaveBeenCalled();
	});
});
