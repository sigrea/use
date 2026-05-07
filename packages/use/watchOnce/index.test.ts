// @vitest-environment node

import { deepSignal, nextTick, signal } from "@sigrea/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import { watchOnce } from "./index";

describe("watchOnce", () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it("runs the callback once on the first source change", () => {
		const source = signal(0);
		const callback = vi.fn();
		const stop = watchOnce(source, callback, { flush: "sync" });

		source.value = 1;
		source.value = 2;

		expect(callback).toHaveBeenCalledTimes(1);
		expect(callback).toHaveBeenCalledWith(1, 0, expect.any(Function));
		stop();
	});

	it("stops safely after an immediate first callback", () => {
		const source = signal("ready");
		const callback = vi.fn();
		const stop = watchOnce(source, callback, {
			flush: "sync",
			immediate: true,
		});

		source.value = "updated";

		expect(callback).toHaveBeenCalledTimes(1);
		expect(callback).toHaveBeenCalledWith(
			"ready",
			undefined,
			expect.any(Function),
		);
		expect(() => stop()).not.toThrow();
	});

	it("uses the default pre flush timing", async () => {
		const source = signal(0);
		const callback = vi.fn();
		const stop = watchOnce(source, callback);

		source.value = 1;
		source.value = 2;
		expect(callback).not.toHaveBeenCalled();

		await nextTick();

		expect(callback).toHaveBeenCalledTimes(1);
		expect(callback).toHaveBeenCalledWith(2, 0, expect.any(Function));
		source.value = 3;
		await nextTick();
		expect(callback).toHaveBeenCalledTimes(1);
		stop();
	});

	it("watches source lists once", () => {
		const left = signal(1);
		const right = signal("ready");
		const callback = vi.fn();
		const stop = watchOnce([left, right] as const, callback, {
			flush: "sync",
		});

		left.value = 2;
		right.value = "ignored";

		expect(callback).toHaveBeenCalledTimes(1);
		expect(callback).toHaveBeenCalledWith(
			[2, "ready"],
			[1, "ready"],
			expect.any(Function),
		);
		stop();
	});

	it("supports immediate source lists", () => {
		const left = signal(1);
		const right = signal("ready");
		const callback = vi.fn();
		const stop = watchOnce([left, right] as const, callback, {
			flush: "sync",
			immediate: true,
		});

		left.value = 2;

		expect(callback).toHaveBeenCalledTimes(1);
		expect(callback).toHaveBeenCalledWith(
			[1, "ready"],
			[],
			expect.any(Function),
		);
		stop();
	});

	it("treats deepSignal arrays as a single source", () => {
		const source = deepSignal([1, 2]);
		const callback = vi.fn();
		const stop = watchOnce(source, callback, { flush: "sync" });

		source.push(3);
		source.push(4);

		expect(callback).toHaveBeenCalledTimes(1);
		expect(callback).toHaveBeenCalledWith(source, source, expect.any(Function));
		stop();
	});

	it("passes deep options to Sigrea watch", () => {
		const source = deepSignal({ nested: { count: 0 } });
		const callback = vi.fn();
		const stop = watchOnce(source, callback, {
			deep: true,
			flush: "sync",
		});

		source.nested.count = 1;
		source.nested.count = 2;

		expect(callback).toHaveBeenCalledTimes(1);
		expect(callback).toHaveBeenCalledWith(source, source, expect.any(Function));
		stop();
	});

	it("runs cleanup registered by the callback when it stops itself", () => {
		const source = signal(0);
		const cleanup = vi.fn();
		const callback = vi.fn((_value, _oldValue, onCleanup) => {
			onCleanup(cleanup);
		});
		const stop = watchOnce(source, callback, { flush: "sync" });

		source.value = 1;

		expect(callback).toHaveBeenCalledTimes(1);
		expect(cleanup).toHaveBeenCalledTimes(1);
		stop();
		expect(cleanup).toHaveBeenCalledTimes(1);
	});

	it("runs cleanup returned from the callback when it stops itself", () => {
		const source = signal(0);
		const cleanup = vi.fn();
		const stop = watchOnce(source, () => cleanup, { flush: "sync" });

		source.value = 1;

		expect(cleanup).toHaveBeenCalledTimes(1);
		stop();
		expect(cleanup).toHaveBeenCalledTimes(1);
	});

	it("does not rerun when the callback mutates the source synchronously", () => {
		const source = signal(0);
		const callback = vi.fn(() => {
			source.value = 2;
		});
		const stop = watchOnce(source, callback, { flush: "sync" });

		source.value = 1;

		expect(callback).toHaveBeenCalledTimes(1);
		expect(source.value).toBe(2);
		stop();
	});

	it("stops before the first source change", () => {
		const source = signal(0);
		const callback = vi.fn();
		const stop = watchOnce(source, callback, { flush: "sync" });

		stop();
		source.value = 1;

		expect(callback).not.toHaveBeenCalled();
	});

	it("stops even when the callback throws", () => {
		const source = signal(0);
		const callback = vi.fn(() => {
			throw new Error("fail");
		});
		const stop = watchOnce(source, callback, { flush: "sync" });

		expect(() => {
			source.value = 1;
		}).toThrow("fail");
		expect(() => {
			source.value = 2;
		}).not.toThrow();
		expect(callback).toHaveBeenCalledTimes(1);
		stop();
	});

	it("stops after an immediate callback throws during setup", () => {
		const source = signal(0);
		const callback = vi.fn(() => {
			throw new Error("fail");
		});

		expect(() => {
			watchOnce(source, callback, { flush: "sync", immediate: true });
		}).toThrow("fail");

		expect(() => {
			source.value = 1;
		}).not.toThrow();
		expect(callback).toHaveBeenCalledTimes(1);
	});
});
