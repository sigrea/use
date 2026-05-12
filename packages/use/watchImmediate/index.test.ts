// @vitest-environment node

import { deepSignal, nextTick, signal } from "@sigrea/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import { watchImmediate } from "./index";

describe("watchImmediate", () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it("runs the callback immediately", () => {
		const source = signal("ready");
		const callback = vi.fn();
		const stop = watchImmediate(source, callback);

		expect(callback).toHaveBeenCalledTimes(1);
		expect(callback).toHaveBeenCalledWith(
			"ready",
			undefined,
			expect.any(Function),
		);
		stop();
	});

	it("continues watching with Sigrea watch options", () => {
		const source = signal(0);
		const callback = vi.fn();
		const stop = watchImmediate(source, callback, { flush: "sync" });

		source.value = 1;

		expect(callback).toHaveBeenCalledTimes(2);
		expect(callback).toHaveBeenLastCalledWith(1, 0, expect.any(Function));
		stop();
	});

	it("uses the default pre flush timing after the immediate run", async () => {
		const source = signal(0);
		const callback = vi.fn();
		const stop = watchImmediate(source, callback);

		source.value = 1;
		expect(callback).toHaveBeenCalledTimes(1);

		await nextTick();

		expect(callback).toHaveBeenCalledTimes(2);
		expect(callback).toHaveBeenLastCalledWith(1, 0, expect.any(Function));
		stop();
	});

	it("watches source lists", () => {
		const left = signal(1);
		const right = signal("ready");
		const callback = vi.fn();
		const stop = watchImmediate([left, right] as const, callback, {
			flush: "sync",
		});

		expect(callback).toHaveBeenCalledTimes(1);
		expect(callback).toHaveBeenCalledWith(
			[1, "ready"],
			[],
			expect.any(Function),
		);

		left.value = 2;

		expect(callback).toHaveBeenCalledTimes(2);
		expect(callback).toHaveBeenLastCalledWith(
			[2, "ready"],
			[1, "ready"],
			expect.any(Function),
		);
		stop();
	});

	it("treats deepSignal arrays as a single source", () => {
		const source = deepSignal([1, 2]);
		const callback = vi.fn();
		const stop = watchImmediate(source, callback, { flush: "sync" });

		source.push(3);

		expect(callback).toHaveBeenCalled();
		expect(callback).toHaveBeenNthCalledWith(
			1,
			source,
			undefined,
			expect.any(Function),
		);
		expect(callback).toHaveBeenLastCalledWith(
			source,
			source,
			expect.any(Function),
		);
		stop();
	});

	it("passes deep options to Sigrea watch", () => {
		const source = deepSignal({ nested: { count: 0 } });
		const callback = vi.fn();
		const stop = watchImmediate(source, callback, {
			deep: true,
			flush: "sync",
		});

		source.nested.count = 1;

		expect(callback).toHaveBeenCalled();
		expect(callback).toHaveBeenLastCalledWith(
			source,
			source,
			expect.any(Function),
		);
		stop();
	});

	it("uses cleanup from the underlying watch", () => {
		const source = signal(0);
		const cleanup = vi.fn();
		const callback = vi.fn((_value, _oldValue, onCleanup) => {
			onCleanup(cleanup);
		});
		const stop = watchImmediate(source, callback, { flush: "sync" });

		expect(cleanup).not.toHaveBeenCalled();

		source.value = 1;
		expect(cleanup).toHaveBeenCalledTimes(1);

		stop();
		expect(cleanup).toHaveBeenCalledTimes(2);
	});

	it("runs cleanup returned from the callback on stop", () => {
		const source = signal(0);
		const cleanup = vi.fn();
		const stop = watchImmediate(source, () => cleanup, { flush: "sync" });

		expect(cleanup).not.toHaveBeenCalled();

		stop();
		expect(cleanup).toHaveBeenCalledTimes(1);
	});

	it("stops watching changes", () => {
		const source = signal(0);
		const callback = vi.fn();
		const stop = watchImmediate(source, callback, { flush: "sync" });

		stop();
		source.value = 1;

		expect(callback).toHaveBeenCalledTimes(1);
	});
});
