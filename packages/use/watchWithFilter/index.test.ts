// @vitest-environment node

import { deepSignal, nextTick, signal } from "@sigrea/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import { watchWithFilter } from "./index";

describe("watchWithFilter", () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it("runs the callback through the default filter", () => {
		const source = signal(0);
		const callback = vi.fn();
		const stop = watchWithFilter(source, callback, { flush: "sync" });

		source.value = 1;

		expect(callback).toHaveBeenCalledTimes(1);
		expect(callback).toHaveBeenCalledWith(1, 0, expect.any(Function));
		stop();
	});

	it("lets the event filter suppress callbacks", () => {
		const source = signal(0);
		const callback = vi.fn();
		const filter = vi.fn();
		const stop = watchWithFilter(source, callback, {
			eventFilter: filter,
			flush: "sync",
		});

		source.value = 1;

		expect(filter).toHaveBeenCalledTimes(1);
		expect(callback).not.toHaveBeenCalled();
		stop();
	});

	it("advances oldValue when the filter skips a callback", () => {
		const source = signal(0);
		const callback = vi.fn();
		let enabled = false;
		const stop = watchWithFilter(source, callback, {
			eventFilter(invoke) {
				if (enabled) return invoke();
			},
			flush: "sync",
		});

		source.value = 1;
		enabled = true;
		source.value = 2;

		expect(callback).toHaveBeenCalledTimes(1);
		expect(callback).toHaveBeenCalledWith(2, 1, expect.any(Function));
		stop();
	});

	it("passes wrapper options to the event filter", () => {
		const source = signal(0);
		const callback = vi.fn();
		const filter = vi.fn((invoke, options) => {
			expect(options.fn).toBe(callback);
			expect(options.args).toEqual([1, 0, expect.any(Function)]);
			expect(options).toHaveProperty("thisArg");
			return invoke();
		});
		const stop = watchWithFilter(source, callback, {
			eventFilter: filter,
			flush: "sync",
		});

		source.value = 1;

		expect(callback).toHaveBeenCalledTimes(1);
		stop();
	});

	it("returns filtered callback cleanup to Sigrea watch", async () => {
		const source = signal(0);
		const cleanup = vi.fn();
		const stop = watchWithFilter(source, () => cleanup, {
			eventFilter: (invoke) => invoke(),
			flush: "sync",
		});

		source.value = 1;
		await Promise.resolve();
		await Promise.resolve();
		expect(cleanup).not.toHaveBeenCalled();

		source.value = 2;
		expect(cleanup).toHaveBeenCalledTimes(1);

		await Promise.resolve();
		await Promise.resolve();
		stop();
		expect(cleanup).toHaveBeenCalledTimes(2);
	});

	it("registers sync cleanup before the next sync callback", () => {
		const source = signal(0);
		const calls: string[] = [];
		const stop = watchWithFilter(
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

	it("supports async event filters", async () => {
		const source = signal(0);
		const cleanup = vi.fn();
		const callback = vi.fn((_value, _oldValue, onCleanup) => {
			onCleanup(cleanup);
		});
		const stop = watchWithFilter(source, callback, {
			eventFilter: async (invoke) => {
				await Promise.resolve();
				return invoke();
			},
			flush: "sync",
		});

		source.value = 1;
		expect(callback).not.toHaveBeenCalled();

		await Promise.resolve();
		await Promise.resolve();

		expect(callback).toHaveBeenCalledTimes(1);
		source.value = 2;
		await Promise.resolve();
		await Promise.resolve();

		expect(cleanup).toHaveBeenCalledTimes(1);
		stop();
		expect(cleanup).toHaveBeenCalledTimes(2);
	});

	it("watches source lists", () => {
		const left = signal(0);
		const right = signal("initial");
		const callback = vi.fn();
		const stop = watchWithFilter([left, right] as const, callback, {
			flush: "sync",
		});

		left.value = 1;
		right.value = "changed";

		expect(callback).toHaveBeenCalledTimes(2);
		expect(callback).toHaveBeenNthCalledWith(
			1,
			[1, "initial"],
			[0, "initial"],
			expect.any(Function),
		);
		expect(callback).toHaveBeenNthCalledWith(
			2,
			[1, "changed"],
			[1, "initial"],
			expect.any(Function),
		);
		stop();
	});

	it("uses an empty oldValue for immediate source lists", () => {
		const left = signal(0);
		const right = signal("initial");
		const callback = vi.fn();
		const stop = watchWithFilter([left, right] as const, callback, {
			flush: "sync",
			immediate: true,
		});

		expect(callback).toHaveBeenCalledTimes(1);
		expect(callback).toHaveBeenCalledWith(
			[0, "initial"],
			[],
			expect.any(Function),
		);
		stop();
	});

	it("treats deepSignal arrays as a single source", () => {
		const source = deepSignal([1, 2]);
		const callback = vi.fn();
		const stop = watchWithFilter(source, callback, { flush: "sync" });

		source.push(3);

		expect(callback).toHaveBeenCalled();
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
		const stop = watchWithFilter(source, callback, {
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

	it("uses the default pre flush timing before filtering", async () => {
		const source = signal(0);
		const callback = vi.fn();
		const stop = watchWithFilter(source, callback);

		source.value = 1;
		expect(callback).not.toHaveBeenCalled();

		await nextTick();

		expect(callback).toHaveBeenCalledTimes(1);
		stop();
	});

	it("stops the underlying watch", () => {
		const source = signal(0);
		const callback = vi.fn();
		const stop = watchWithFilter(source, callback, { flush: "sync" });

		stop();
		source.value = 1;

		expect(callback).not.toHaveBeenCalled();
	});

	it("does not run deferred filter invocations after stop", () => {
		vi.useFakeTimers();
		const source = signal(0);
		const callback = vi.fn();
		const stop = watchWithFilter(source, callback, {
			eventFilter: (invoke) => {
				setTimeout(invoke, 10);
			},
			flush: "sync",
		});

		source.value = 1;
		stop();
		vi.advanceTimersByTime(10);

		expect(callback).not.toHaveBeenCalled();
	});

	it("does not run async filter invocations after stop", async () => {
		const source = signal(0);
		const callback = vi.fn();
		let resume!: () => void;
		const resumed = new Promise<void>((resolve) => {
			resume = resolve;
		});
		const stop = watchWithFilter(source, callback, {
			eventFilter: async (invoke) => {
				await resumed;
				return invoke();
			},
			flush: "sync",
		});

		source.value = 1;
		stop();
		resume();
		await resumed;
		await Promise.resolve();

		expect(callback).not.toHaveBeenCalled();
	});
});
