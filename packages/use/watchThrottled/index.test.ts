// @vitest-environment node

import {
	createScope,
	deepSignal,
	disposeScope,
	nextTick,
	runWithScope,
	signal,
} from "@sigrea/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import { watchThrottled } from "./index";

describe("watchThrottled", () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it("runs immediately when throttle is zero", () => {
		const source = signal(0);
		const callback = vi.fn();
		const stop = watchThrottled(source, callback, {
			flush: "sync",
			throttle: 0,
		});

		source.value = 1;
		source.value = 2;

		expect(callback).toHaveBeenCalledTimes(2);
		expect(callback).toHaveBeenNthCalledWith(1, 1, 0, expect.any(Function));
		expect(callback).toHaveBeenNthCalledWith(2, 2, 1, expect.any(Function));
		stop();
	});

	it("runs leading and trailing callbacks by default", () => {
		vi.useFakeTimers();
		const source = signal(0);
		const callback = vi.fn();
		const stop = watchThrottled(source, callback, {
			flush: "sync",
			throttle: 20,
		});

		source.value = 1;
		source.value = 2;
		vi.advanceTimersByTime(19);

		expect(callback).toHaveBeenCalledTimes(1);
		expect(callback).toHaveBeenCalledWith(1, 0, expect.any(Function));

		vi.advanceTimersByTime(1);

		expect(callback).toHaveBeenCalledTimes(2);
		expect(callback).toHaveBeenLastCalledWith(2, 1, expect.any(Function));
		stop();
	});

	it("can disable leading callbacks", () => {
		vi.useFakeTimers();
		const source = signal(0);
		const callback = vi.fn();
		const stop = watchThrottled(source, callback, {
			flush: "sync",
			leading: false,
			throttle: 20,
		});

		source.value = 1;
		vi.advanceTimersByTime(19);

		expect(callback).not.toHaveBeenCalled();

		vi.advanceTimersByTime(1);

		expect(callback).toHaveBeenCalledTimes(1);
		expect(callback).toHaveBeenCalledWith(1, 0, expect.any(Function));
		stop();
	});

	it("can disable trailing callbacks", () => {
		vi.useFakeTimers();
		const source = signal(0);
		const callback = vi.fn();
		const stop = watchThrottled(source, callback, {
			flush: "sync",
			throttle: 20,
			trailing: false,
		});

		source.value = 1;
		source.value = 2;
		vi.advanceTimersByTime(20);

		expect(callback).toHaveBeenCalledTimes(1);
		expect(callback).toHaveBeenCalledWith(1, 0, expect.any(Function));
		stop();
	});

	it("supports reactive throttle time", () => {
		vi.useFakeTimers();
		const source = signal(0);
		const delay = signal(20);
		const callback = vi.fn();
		const stop = watchThrottled(source, callback, {
			flush: "sync",
			throttle: delay,
		});

		source.value = 1;
		delay.value = 50;
		source.value = 2;
		vi.advanceTimersByTime(49);

		expect(callback).toHaveBeenCalledTimes(1);

		vi.advanceTimersByTime(1);

		expect(callback).toHaveBeenCalledTimes(2);
		expect(callback).toHaveBeenLastCalledWith(2, 1, expect.any(Function));
		stop();
	});

	it("runs immediate callback through the throttle", () => {
		const source = signal("ready");
		const callback = vi.fn();
		const stop = watchThrottled(source, callback, {
			flush: "sync",
			immediate: true,
			throttle: 0,
		});

		expect(callback).toHaveBeenCalledTimes(1);
		expect(callback).toHaveBeenCalledWith(
			"ready",
			undefined,
			expect.any(Function),
		);
		stop();
	});

	it("cancels pending trailing callbacks when stopped", () => {
		vi.useFakeTimers();
		const source = signal(0);
		const callback = vi.fn();
		const stop = watchThrottled(source, callback, {
			flush: "sync",
			throttle: 20,
		});

		source.value = 1;
		source.value = 2;
		stop();
		expect(vi.getTimerCount()).toBe(0);

		vi.advanceTimersByTime(20);

		expect(callback).toHaveBeenCalledTimes(1);
	});

	it("cancels pending trailing callbacks when the scope is disposed", () => {
		vi.useFakeTimers();
		const scope = createScope();
		const source = signal(0);
		const callback = vi.fn();
		let stop!: () => void;

		runWithScope(scope, () => {
			stop = watchThrottled(source, callback, {
				flush: "sync",
				throttle: 20,
			});
		});

		source.value = 1;
		source.value = 2;
		disposeScope(scope);
		expect(vi.getTimerCount()).toBe(0);

		vi.advanceTimersByTime(20);

		expect(callback).toHaveBeenCalledTimes(1);
		stop();
	});

	it("keeps cleanup registered by the throttled callback", () => {
		const source = signal(0);
		const cleanup = vi.fn();
		const callback = vi.fn((_value, _oldValue, onCleanup) => {
			onCleanup(cleanup);
		});
		const stop = watchThrottled(source, callback, {
			flush: "sync",
			throttle: 0,
		});

		source.value = 1;
		expect(cleanup).not.toHaveBeenCalled();

		source.value = 2;

		expect(cleanup).toHaveBeenCalledTimes(1);
		stop();
	});

	it("keeps cleanup returned from the throttled callback", () => {
		const source = signal(0);
		const cleanup = vi.fn();
		const stop = watchThrottled(source, () => cleanup, {
			flush: "sync",
			throttle: 0,
		});

		source.value = 1;
		expect(cleanup).not.toHaveBeenCalled();

		stop();

		expect(cleanup).toHaveBeenCalledTimes(1);
	});

	it("watches source lists", () => {
		vi.useFakeTimers();
		const left = signal(0);
		const right = signal("initial");
		const callback = vi.fn();
		const stop = watchThrottled([left, right] as const, callback, {
			flush: "sync",
			throttle: 20,
		});

		left.value = 1;
		right.value = "changed";
		vi.advanceTimersByTime(20);

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

	it("treats deepSignal arrays as a single source", () => {
		const source = deepSignal([1, 2]);
		const callback = vi.fn();
		const stop = watchThrottled(source, callback, {
			flush: "sync",
			throttle: 0,
		});

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
		const stop = watchThrottled(source, callback, {
			deep: true,
			flush: "sync",
			throttle: 0,
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

	it("uses the default pre flush timing before throttle", async () => {
		vi.useFakeTimers();
		const source = signal(0);
		const callback = vi.fn();
		const stop = watchThrottled(source, callback, { throttle: 20 });

		source.value = 1;
		vi.advanceTimersByTime(20);
		expect(callback).not.toHaveBeenCalled();

		await nextTick();

		expect(callback).toHaveBeenCalledTimes(1);
		stop();
	});
});
