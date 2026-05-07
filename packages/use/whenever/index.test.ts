// @vitest-environment node

import { deepSignal, nextTick, signal } from "@sigrea/core";
import { describe, expect, it, vi } from "vitest";

import { whenever } from "./index";

describe("whenever", () => {
	it("runs the callback only when the source value is truthy", () => {
		const source = signal<number | null | undefined>(1);
		const callback = vi.fn();
		const stop = whenever(source, callback, { flush: "sync" });

		source.value = 2;
		source.value = 0;
		source.value = 3;
		source.value = null;
		source.value = undefined;
		source.value = 4;

		expect(callback).toHaveBeenCalledTimes(3);
		expect(callback).toHaveBeenNthCalledWith(1, 2, 1, expect.any(Function));
		expect(callback).toHaveBeenNthCalledWith(2, 3, 0, expect.any(Function));
		expect(callback).toHaveBeenNthCalledWith(
			3,
			4,
			undefined,
			expect.any(Function),
		);
		stop();
	});

	it("skips every falsy primitive value", () => {
		const source = signal<0 | 0n | "" | false | null | undefined | "ready">(
			false,
		);
		const callback = vi.fn();
		const stop = whenever(source, callback, { flush: "sync" });

		source.value = 0;
		source.value = 0n;
		source.value = "";
		source.value = null;
		source.value = undefined;
		source.value = "ready";

		expect(callback).toHaveBeenCalledTimes(1);
		expect(callback).toHaveBeenCalledWith(
			"ready",
			undefined,
			expect.any(Function),
		);
		stop();
	});

	it("uses the default pre flush timing", async () => {
		const source = signal(false);
		const callback = vi.fn();
		const stop = whenever(source, callback);

		source.value = true;
		expect(callback).not.toHaveBeenCalled();

		await nextTick();

		expect(callback).toHaveBeenCalledTimes(1);
		expect(callback).toHaveBeenCalledWith(true, false, expect.any(Function));
		stop();
	});

	it("does not run immediately when the current value is falsy", () => {
		const source = signal<number | null>(null);
		const callback = vi.fn();
		const stop = whenever(source, callback, {
			flush: "sync",
			immediate: true,
		});

		expect(callback).not.toHaveBeenCalled();

		source.value = 1;

		expect(callback).toHaveBeenCalledTimes(1);
		expect(callback).toHaveBeenCalledWith(1, null, expect.any(Function));
		stop();
	});

	it("runs immediately when the current value is truthy", () => {
		const source = signal<false | "ready">("ready");
		const callback = vi.fn();
		const stop = whenever(source, callback, {
			flush: "sync",
			immediate: true,
		});

		expect(callback).toHaveBeenCalledTimes(1);
		expect(callback).toHaveBeenCalledWith(
			"ready",
			undefined,
			expect.any(Function),
		);
		stop();
	});

	it("stops after the first truthy callback when once is true", () => {
		const source = signal(0);
		const callback = vi.fn();
		const stop = whenever(source, callback, { flush: "sync", once: true });

		source.value = 1;
		source.value = 2;

		expect(callback).toHaveBeenCalledTimes(1);
		expect(callback).toHaveBeenCalledWith(1, 0, expect.any(Function));
		stop();
	});

	it("does not reenter a once callback during sync source updates", () => {
		const source = signal(0);
		const values: number[] = [];
		const stop = whenever(
			source,
			(value) => {
				values.push(value);
				source.value = 2;
			},
			{ flush: "sync", once: true },
		);

		source.value = 1;
		source.value = 3;

		expect(values).toEqual([1]);
		stop();
	});

	it("handles once with an immediate truthy value during setup", () => {
		const source = signal(true);
		const cleanup = vi.fn();
		const callback = vi.fn(() => cleanup);
		const stop = whenever(source, callback, {
			flush: "sync",
			immediate: true,
			once: true,
		});

		expect(callback).toHaveBeenCalledTimes(1);
		expect(cleanup).toHaveBeenCalledTimes(1);

		source.value = false;
		source.value = true;

		expect(callback).toHaveBeenCalledTimes(1);
		stop();
		expect(cleanup).toHaveBeenCalledTimes(1);
	});

	it("does not reenter an immediate once callback during setup", () => {
		const source = signal(1);
		const values: number[] = [];
		const stop = whenever(
			source,
			(value) => {
				values.push(value);
				source.value = 2;
			},
			{ flush: "sync", immediate: true, once: true },
		);

		source.value = 3;

		expect(values).toEqual([1]);
		stop();
	});

	it("stops an immediate once watcher when the callback throws", () => {
		const source = signal(true);
		const error = new Error("boom");
		const callback = vi.fn(() => {
			throw error;
		});

		expect(() =>
			whenever(source, callback, {
				flush: "sync",
				immediate: true,
				once: true,
			}),
		).toThrow(error);

		source.value = false;
		source.value = true;

		expect(callback).toHaveBeenCalledTimes(1);
	});

	it("registers returned cleanup before the next sync callback", () => {
		const source = signal(0);
		const calls: string[] = [];
		const stop = whenever(
			source,
			(value) => {
				calls.push(`callback:${value}`);
				return () => {
					calls.push(`cleanup:${value}`);
				};
			},
			{ flush: "sync" },
		);

		source.value = 1;
		source.value = 2;

		expect(calls).toEqual(["callback:1", "cleanup:1", "callback:2"]);
		stop();
		expect(calls).toEqual([
			"callback:1",
			"cleanup:1",
			"callback:2",
			"cleanup:2",
		]);
	});

	it("supports onCleanup", () => {
		const source = signal(0);
		const cleanup = vi.fn();
		const callback = vi.fn((_value, _oldValue, onCleanup) => {
			onCleanup(cleanup);
		});
		const stop = whenever(source, callback, { flush: "sync" });

		source.value = 1;
		source.value = 2;

		expect(callback).toHaveBeenCalledTimes(2);
		expect(cleanup).toHaveBeenCalledTimes(1);

		stop();
		expect(cleanup).toHaveBeenCalledTimes(2);
	});

	it("accepts getter sources", () => {
		const count = signal(0);
		const callback = vi.fn();
		const stop = whenever(() => count.value === 2, callback, {
			flush: "sync",
		});

		count.value = 1;
		count.value = 2;
		count.value = 3;
		count.value = 2;

		expect(callback).toHaveBeenCalledTimes(2);
		expect(callback).toHaveBeenNthCalledWith(
			1,
			true,
			false,
			expect.any(Function),
		);
		expect(callback).toHaveBeenNthCalledWith(
			2,
			true,
			false,
			expect.any(Function),
		);
		stop();
	});

	it("accepts DeepSignal sources", () => {
		const source = deepSignal({ ready: true });
		const callback = vi.fn();
		const stop = whenever(source, callback, { flush: "sync", immediate: true });

		expect(callback).toHaveBeenCalledTimes(1);
		expect(callback).toHaveBeenCalledWith(
			source,
			undefined,
			expect.any(Function),
		);
		stop();
	});
});
