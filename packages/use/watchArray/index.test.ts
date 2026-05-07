// @vitest-environment node

import { deepSignal, nextTick, signal } from "@sigrea/core";
import type { WatchStopHandle } from "@sigrea/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import { watchArray } from "./index";

const stops: WatchStopHandle[] = [];

function trackStop(stop: WatchStopHandle): WatchStopHandle {
	stops.push(stop);
	return stop;
}

describe("watchArray", () => {
	afterEach(() => {
		while (stops.length > 0) {
			stops.pop()?.();
		}
	});

	it("reports added and removed values when a signal array changes", () => {
		const list = signal([1, 2, 3]);
		const callback = vi.fn();
		trackStop(watchArray(list, callback, { flush: "sync" }));

		list.value = [1, 1, 4];

		expect(callback).toHaveBeenCalledTimes(1);
		expect(callback).toHaveBeenCalledWith(
			[1, 1, 4],
			[1, 2, 3],
			[1, 4],
			[2, 3],
			expect.any(Function),
		);
	});

	it("reports empty changes when replacement contents are identical", () => {
		const list = signal([1, 2, 3]);
		const callback = vi.fn();
		trackStop(watchArray(list, callback, { flush: "sync" }));

		list.value = [1, 2, 3];

		expect(callback).toHaveBeenCalledTimes(1);
		expect(callback).toHaveBeenCalledWith(
			[1, 2, 3],
			[1, 2, 3],
			[],
			[],
			expect.any(Function),
		);
	});

	it("tracks getter sources", () => {
		const list = signal([1, 2, 3]);
		const callback = vi.fn();
		trackStop(watchArray(() => list.value, callback, { flush: "sync" }));

		list.value = [1, 2, 3, 4];

		expect(callback).toHaveBeenCalledTimes(1);
		expect(callback).toHaveBeenCalledWith(
			[1, 2, 3, 4],
			[1, 2, 3],
			[4],
			[],
			expect.any(Function),
		);
	});

	it("uses Object.is when comparing items", () => {
		const list = signal([Number.NaN, 0]);
		const callback = vi.fn();
		trackStop(watchArray(list, callback, { flush: "sync" }));

		list.value = [Number.NaN, -0];

		expect(callback).toHaveBeenCalledTimes(1);
		expect(callback).toHaveBeenCalledWith(
			[Number.NaN, -0],
			[Number.NaN, 0],
			[-0],
			[0],
			expect.any(Function),
		);
	});

	it("treats raw arrays as a single array value", () => {
		const callback = vi.fn();
		trackStop(
			watchArray([1, 2], callback, {
				flush: "sync",
				immediate: true,
			}),
		);

		expect(callback).toHaveBeenCalledTimes(1);
		expect(callback).toHaveBeenCalledWith(
			[1, 2],
			[],
			[1, 2],
			[],
			expect.any(Function),
		);
	});

	it("tracks in-place deep signal array changes", async () => {
		const list = deepSignal([1, 2, 3]);
		const callback = vi.fn();
		trackStop(watchArray(list, callback, { deep: true }));

		list.splice(1, 1, 5, 6, 7);
		await nextTick();

		expect(callback).toHaveBeenCalledTimes(1);
		expect(callback).toHaveBeenCalledWith(
			[1, 5, 6, 7, 3],
			[1, 2, 3],
			[5, 6, 7],
			[2],
			expect.any(Function),
		);
	});

	it("uses an empty previous list when immediate is true", () => {
		const list = signal([1, 2, 3]);
		const callback = vi.fn();
		trackStop(
			watchArray(list, callback, {
				flush: "sync",
				immediate: true,
			}),
		);

		expect(callback).toHaveBeenCalledTimes(1);
		expect(callback).toHaveBeenCalledWith(
			[1, 2, 3],
			[],
			[1, 2, 3],
			[],
			expect.any(Function),
		);
	});

	it("uses watch cleanup and stop behavior", () => {
		const list = signal([1]);
		const cleanup = vi.fn();
		const callback = vi.fn((_next, _old, _added, _removed, onCleanup) => {
			onCleanup(cleanup);
		});
		const stop = trackStop(watchArray(list, callback, { flush: "sync" }));

		list.value = [1, 2];
		expect(cleanup).not.toHaveBeenCalled();

		list.value = [2];
		expect(cleanup).toHaveBeenCalledTimes(1);

		stop();
		expect(cleanup).toHaveBeenCalledTimes(2);

		list.value = [3];
		expect(callback).toHaveBeenCalledTimes(2);
	});

	it("uses cleanup returned from the callback", () => {
		const list = signal([1]);
		const cleanup = vi.fn();
		const callback = vi.fn(() => cleanup);
		const stop = trackStop(watchArray(list, callback, { flush: "sync" }));

		list.value = [1, 2];
		expect(cleanup).not.toHaveBeenCalled();

		list.value = [2];
		expect(cleanup).toHaveBeenCalledTimes(1);

		stop();
		expect(cleanup).toHaveBeenCalledTimes(2);
	});

	it("honors the default pre flush timing", async () => {
		const list = signal([1]);
		const callback = vi.fn();
		trackStop(watchArray(list, callback));

		list.value = [1, 2];

		expect(callback).not.toHaveBeenCalled();
		await nextTick();
		expect(callback).toHaveBeenCalledTimes(1);
		expect(callback).toHaveBeenCalledWith(
			[1, 2],
			[1],
			[2],
			[],
			expect.any(Function),
		);
	});
});
