// @vitest-environment node

import { deepSignal, nextTick, signal } from "@sigrea/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import { watchTriggerable } from "./index";

describe("watchTriggerable", () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it("triggers the callback immediately with the current source value", () => {
		const source = signal(1);
		const callback = vi.fn((value: number) => `value:${value}`);
		const controls = watchTriggerable(source, callback);

		const result = controls.trigger();

		expect(result).toBe("value:1");
		expect(callback).toHaveBeenCalledTimes(1);
		expect(callback).toHaveBeenCalledWith(1, undefined, expect.any(Function));
		controls.stop();
	});

	it("keeps default pre flush timing for source changes", async () => {
		const source = signal(0);
		const callback = vi.fn();
		const controls = watchTriggerable(source, callback);

		source.value = 1;
		expect(callback).not.toHaveBeenCalled();

		await nextTick();

		expect(callback).toHaveBeenCalledTimes(1);
		expect(callback).toHaveBeenCalledWith(1, 0, expect.any(Function));

		controls.trigger();
		expect(callback).toHaveBeenCalledTimes(2);
		expect(callback).toHaveBeenLastCalledWith(
			1,
			undefined,
			expect.any(Function),
		);
		controls.stop();
	});

	it("watches source lists and uses undefined old values for manual trigger", () => {
		const left = signal(1);
		const right = signal("ready");
		const callback = vi.fn();
		const controls = watchTriggerable([left, right] as const, callback, {
			flush: "sync",
		});

		controls.trigger();
		right.value = "changed";

		expect(callback).toHaveBeenCalledTimes(2);
		expect(callback).toHaveBeenNthCalledWith(
			1,
			[1, "ready"],
			[undefined, undefined],
			expect.any(Function),
		);
		expect(callback).toHaveBeenNthCalledWith(
			2,
			[1, "changed"],
			[1, "ready"],
			expect.any(Function),
		);
		controls.stop();
	});

	it("treats deepSignal arrays as a single source", () => {
		const source = deepSignal([1, 2]);
		const callback = vi.fn();
		const controls = watchTriggerable(source, callback, { flush: "sync" });

		controls.trigger();
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
		controls.stop();
	});

	it("runs registered cleanup before the next callback and on stop", () => {
		const source = signal(0);
		const cleanup = vi.fn();
		const callback = vi.fn((_value, _oldValue, onCleanup) => {
			onCleanup(cleanup);
		});
		const controls = watchTriggerable(source, callback, { flush: "sync" });

		controls.trigger();
		expect(cleanup).not.toHaveBeenCalled();

		source.value = 1;
		expect(cleanup).toHaveBeenCalledTimes(1);

		controls.stop();
		expect(cleanup).toHaveBeenCalledTimes(2);
	});

	it("does not run trigger after stop", () => {
		const source = signal(0);
		const cleanup = vi.fn();
		const callback = vi.fn((_value, _oldValue, onCleanup) => {
			onCleanup(cleanup);
			return "triggered";
		});
		const controls = watchTriggerable(source, callback, { flush: "sync" });

		expect(controls.trigger()).toBe("triggered");
		controls.stop();

		expect(controls.trigger()).toBeUndefined();
		expect(callback).toHaveBeenCalledTimes(1);
		expect(cleanup).toHaveBeenCalledTimes(1);
	});

	it("does not pass callback return values to the underlying watch cleanup", () => {
		const source = signal(0);
		const returnedCleanup = vi.fn();
		const controls = watchTriggerable(source, () => returnedCleanup, {
			flush: "sync",
		});

		source.value = 1;
		source.value = 2;
		controls.stop();

		expect(returnedCleanup).not.toHaveBeenCalled();
	});

	it("returns callback values from manual trigger without treating them as cleanup", () => {
		const source = signal(0);
		const returned = vi.fn();
		const controls = watchTriggerable(source, () => returned, {
			flush: "sync",
		});

		const result = controls.trigger();
		controls.stop();

		expect(result).toBe(returned);
		expect(returned).not.toHaveBeenCalled();
	});

	it("ignores source updates made during trigger", () => {
		const source = signal(0);
		const callback = vi.fn((value: number) => {
			if (value === 0) {
				source.value = 1;
			}
		});
		const controls = watchTriggerable(source, callback, { flush: "sync" });

		controls.trigger();
		source.value = 2;

		expect(callback).toHaveBeenCalledTimes(2);
		expect(callback).toHaveBeenNthCalledWith(
			1,
			0,
			undefined,
			expect.any(Function),
		);
		expect(callback).toHaveBeenNthCalledWith(2, 2, 1, expect.any(Function));
		controls.stop();
	});

	it("supports async trigger return values", async () => {
		const source = signal(2);
		const controls = watchTriggerable(source, async (value) => {
			await Promise.resolve();
			return value * 2;
		});

		await expect(controls.trigger()).resolves.toBe(4);
		controls.stop();
	});

	it("passes deep options to watchIgnorable", () => {
		const source = deepSignal({ nested: { count: 0 } });
		const callback = vi.fn();
		const controls = watchTriggerable(source, callback, {
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
		controls.stop();
	});
});
