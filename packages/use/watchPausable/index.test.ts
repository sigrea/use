// @vitest-environment node

import { deepSignal, nextTick, signal } from "@sigrea/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import { watchPausable } from "./index";

describe("watchPausable", () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it("pauses and resumes user callbacks without stopping the watch", () => {
		const source = signal(0);
		const callback = vi.fn();
		const controls = watchPausable(source, callback, { flush: "sync" });

		source.value = 1;
		controls.pause();
		source.value = 2;
		controls.resume();
		source.value = 3;

		expect(controls.isActive.value).toBe(true);
		expect(callback).toHaveBeenCalledTimes(2);
		expect(callback).toHaveBeenNthCalledWith(1, 1, 0, expect.any(Function));
		expect(callback).toHaveBeenNthCalledWith(2, 3, 2, expect.any(Function));
		controls.stop();
	});

	it("starts paused when initialState is paused", () => {
		const source = signal(0);
		const callback = vi.fn();
		const controls = watchPausable(source, callback, {
			flush: "sync",
			initialState: "paused",
		});

		source.value = 1;
		controls.resume();
		source.value = 2;

		expect(callback).toHaveBeenCalledTimes(1);
		expect(callback).toHaveBeenCalledWith(2, 1, expect.any(Function));
		controls.stop();
	});

	it("suppresses immediate callback when initially paused", () => {
		const source = signal(0);
		const callback = vi.fn();
		const controls = watchPausable(source, callback, {
			flush: "sync",
			immediate: true,
			initialState: "paused",
		});

		source.value = 1;
		controls.resume();
		source.value = 2;

		expect(callback).toHaveBeenCalledTimes(1);
		expect(callback).toHaveBeenCalledWith(2, 1, expect.any(Function));
		controls.stop();
	});

	it("runs immediate callback when initially active", () => {
		const source = signal("ready");
		const callback = vi.fn();
		const controls = watchPausable(source, callback, {
			flush: "sync",
			immediate: true,
		});

		expect(callback).toHaveBeenCalledTimes(1);
		expect(callback).toHaveBeenCalledWith(
			"ready",
			undefined,
			expect.any(Function),
		);
		controls.stop();
	});

	it("uses the default pre flush timing", async () => {
		const source = signal(0);
		const callback = vi.fn();
		const controls = watchPausable(source, callback);

		source.value = 1;
		controls.pause();
		await nextTick();

		expect(callback).not.toHaveBeenCalled();

		controls.resume();
		source.value = 2;
		await nextTick();

		expect(callback).toHaveBeenCalledTimes(1);
		expect(callback).toHaveBeenCalledWith(2, 1, expect.any(Function));
		controls.stop();
	});

	it("ignores pre-flush updates made while paused before resume", async () => {
		const source = signal(0);
		const callback = vi.fn();
		const controls = watchPausable(source, callback);

		controls.pause();
		source.value = 1;
		controls.resume();
		await nextTick();

		expect(callback).not.toHaveBeenCalled();

		source.value = 2;
		await nextTick();

		expect(callback).toHaveBeenCalledTimes(1);
		expect(callback).toHaveBeenCalledWith(2, 1, expect.any(Function));
		controls.stop();
	});

	it("ignores post-flush updates made while paused before resume", async () => {
		const source = signal(0);
		const callback = vi.fn();
		const controls = watchPausable(source, callback, { flush: "post" });

		controls.pause();
		source.value = 1;
		controls.resume();
		await nextTick();

		expect(callback).not.toHaveBeenCalled();

		source.value = 2;
		await nextTick();

		expect(callback).toHaveBeenCalledTimes(1);
		expect(callback).toHaveBeenCalledWith(2, 1, expect.any(Function));
		controls.stop();
	});

	it("runs active pre-flush updates after paused updates in the same tick", async () => {
		const source = signal(0);
		const callback = vi.fn();
		const controls = watchPausable(source, callback);

		controls.pause();
		source.value = 1;
		controls.resume();
		source.value = 2;
		await nextTick();

		expect(callback).toHaveBeenCalledTimes(1);
		expect(callback).toHaveBeenCalledWith(2, 0, expect.any(Function));
		controls.stop();
	});

	it("watches source lists and keeps old values fresh while paused", () => {
		const left = signal(1);
		const right = signal("ready");
		const callback = vi.fn();
		const controls = watchPausable([left, right] as const, callback, {
			flush: "sync",
		});

		controls.pause();
		left.value = 2;
		controls.resume();
		right.value = "logged";

		expect(callback).toHaveBeenCalledTimes(1);
		expect(callback).toHaveBeenCalledWith(
			[2, "logged"],
			[2, "ready"],
			expect.any(Function),
		);
		controls.stop();
	});

	it("treats deepSignal arrays as a single source", () => {
		const source = deepSignal([1, 2]);
		const callback = vi.fn();
		const controls = watchPausable(source, callback, { flush: "sync" });

		controls.pause();
		source.push(3);
		expect(callback).not.toHaveBeenCalled();

		controls.resume();
		source.push(4);

		expect(callback).toHaveBeenCalled();
		expect(callback).toHaveBeenLastCalledWith(
			source,
			source,
			expect.any(Function),
		);
		controls.stop();
	});

	it("passes deep options to Sigrea watch", () => {
		const source = deepSignal({ nested: { count: 0 } });
		const callback = vi.fn();
		const controls = watchPausable(source, callback, {
			deep: true,
			flush: "sync",
		});

		controls.pause();
		source.nested.count = 1;
		expect(callback).not.toHaveBeenCalled();

		controls.resume();
		source.nested.count = 2;

		expect(callback).toHaveBeenCalled();
		expect(callback).toHaveBeenLastCalledWith(
			source,
			source,
			expect.any(Function),
		);
		controls.stop();
	});

	it("invalidates cleanup while paused because the underlying watch keeps running", () => {
		const source = signal(0);
		const cleanup = vi.fn();
		const callback = vi.fn((_value, _oldValue, onCleanup) => {
			onCleanup(cleanup);
		});
		const controls = watchPausable(source, callback, { flush: "sync" });

		source.value = 1;
		controls.pause();
		source.value = 2;

		expect(callback).toHaveBeenCalledTimes(1);
		expect(cleanup).toHaveBeenCalledTimes(1);
		controls.stop();
		expect(cleanup).toHaveBeenCalledTimes(1);
	});

	it("runs cleanup returned from the callback on stop", () => {
		const source = signal(0);
		const cleanup = vi.fn();
		const controls = watchPausable(source, () => cleanup, { flush: "sync" });

		source.value = 1;
		expect(cleanup).not.toHaveBeenCalled();

		controls.stop();
		expect(cleanup).toHaveBeenCalledTimes(1);
	});

	it("stops the underlying watch", () => {
		const source = signal(0);
		const callback = vi.fn();
		const controls = watchPausable(source, callback, { flush: "sync" });

		controls.stop();
		source.value = 1;

		expect(callback).not.toHaveBeenCalled();
	});
});
