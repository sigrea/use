// @vitest-environment node

import { deepSignal, nextTick, signal } from "@sigrea/core";
import type { WatchStopHandle } from "@sigrea/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import { watchIgnorable } from "./index";

const stops: WatchStopHandle[] = [];

function trackStop<TControls extends { stop(): void }>(
	controls: TControls,
): TControls {
	stops.push(controls.stop);
	return controls;
}

describe("watchIgnorable", () => {
	afterEach(() => {
		while (stops.length > 0) {
			stops.pop()?.();
		}
		vi.useRealTimers();
	});

	it("ignores updates inside ignoreUpdates with sync flushing", () => {
		const source = signal("initial");
		const callback = vi.fn();
		const controls = trackStop(
			watchIgnorable(source, callback, { flush: "sync" }),
		);

		source.value = "logged";
		controls.ignoreUpdates(() => {
			source.value = "ignored";
		});
		source.value = "after";

		expect(callback).toHaveBeenCalledTimes(2);
		expect(callback).toHaveBeenNthCalledWith(
			1,
			"logged",
			"initial",
			expect.any(Function),
		);
		expect(callback).toHaveBeenNthCalledWith(
			2,
			"after",
			"ignored",
			expect.any(Function),
		);
	});

	it("leaves ignorePrevAsyncUpdates as a sync-flush no-op", () => {
		const source = signal(0);
		const callback = vi.fn();
		const controls = trackStop(
			watchIgnorable(source, callback, { flush: "sync" }),
		);

		source.value = 1;
		controls.ignorePrevAsyncUpdates();
		source.value = 2;

		expect(callback).toHaveBeenCalledTimes(2);
		expect(callback).toHaveBeenLastCalledWith(2, 1, expect.any(Function));
	});

	it("keeps sync-flush ignore active across nested ignoreUpdates", () => {
		const source = signal(0);
		const callback = vi.fn();
		const controls = trackStop(
			watchIgnorable(source, callback, { flush: "sync" }),
		);

		controls.ignoreUpdates(() => {
			source.value = 1;
			controls.ignoreUpdates(() => {
				source.value = 2;
			});
			source.value = 3;
		});
		source.value = 4;

		expect(callback).toHaveBeenCalledTimes(1);
		expect(callback).toHaveBeenCalledWith(4, 3, expect.any(Function));
	});

	it("ignores async pre-flush updates made inside ignoreUpdates", async () => {
		const source = signal("initial");
		const callback = vi.fn();
		const controls = trackStop(watchIgnorable(source, callback));

		source.value = "logged";
		await nextTick();

		controls.ignoreUpdates(() => {
			source.value = "ignored";
		});
		await nextTick();

		source.value = "after";
		await nextTick();

		expect(callback).toHaveBeenCalledTimes(2);
		expect(callback).toHaveBeenNthCalledWith(
			1,
			"logged",
			"initial",
			expect.any(Function),
		);
		expect(callback).toHaveBeenNthCalledWith(
			2,
			"after",
			"ignored",
			expect.any(Function),
		);
	});

	it("runs async pre-flush callback when a later update follows an ignored update", async () => {
		const source = signal("initial");
		const callback = vi.fn();
		const controls = trackStop(watchIgnorable(source, callback));

		controls.ignoreUpdates(() => {
			source.value = "ignored";
		});
		source.value = "logged";
		await nextTick();

		expect(callback).toHaveBeenCalledTimes(1);
		expect(callback).toHaveBeenCalledWith(
			"logged",
			"initial",
			expect.any(Function),
		);
	});

	it("ignores already queued async updates with ignorePrevAsyncUpdates", async () => {
		const source = signal("initial");
		const callback = vi.fn();
		const controls = trackStop(watchIgnorable(source, callback));

		source.value = "skip-1";
		source.value = "skip-2";
		controls.ignorePrevAsyncUpdates();
		await nextTick();

		source.value = "prev";
		controls.ignorePrevAsyncUpdates();
		source.value = "after";
		await nextTick();

		expect(callback).toHaveBeenCalledTimes(1);
		expect(callback).toHaveBeenCalledWith(
			"after",
			"skip-2",
			expect.any(Function),
		);
	});

	it("ignores post-flush updates made inside ignoreUpdates", async () => {
		const source = signal(0);
		const callback = vi.fn();
		const controls = trackStop(
			watchIgnorable(source, callback, { flush: "post" }),
		);

		controls.ignoreUpdates(() => {
			source.value = 1;
		});
		await nextTick();

		source.value = 2;
		await nextTick();

		expect(callback).toHaveBeenCalledTimes(1);
		expect(callback).toHaveBeenCalledWith(2, 1, expect.any(Function));
	});

	it("uses cleanup from the underlying watch invalidation", async () => {
		const source = signal(0);
		const cleanup = vi.fn();
		const callback = vi.fn((_value, _oldValue, onCleanup) => {
			onCleanup(cleanup);
		});
		const controls = trackStop(watchIgnorable(source, callback));

		source.value = 1;
		await nextTick();
		expect(cleanup).not.toHaveBeenCalled();

		controls.ignoreUpdates(() => {
			source.value = 2;
		});
		await nextTick();
		expect(callback).toHaveBeenCalledTimes(1);
		expect(cleanup).toHaveBeenCalledTimes(1);

		source.value = 3;
		await nextTick();
		controls.stop();

		expect(callback).toHaveBeenCalledTimes(2);
		expect(cleanup).toHaveBeenCalledTimes(2);
	});

	it("runs cleanup returned from the callback on stop", () => {
		const source = signal(0);
		const cleanup = vi.fn();
		const controls = trackStop(
			watchIgnorable(source, () => cleanup, { flush: "sync" }),
		);

		source.value = 1;
		expect(cleanup).not.toHaveBeenCalled();

		controls.stop();
		expect(cleanup).toHaveBeenCalledTimes(1);
	});

	it("supports deepSignal entries in source lists", () => {
		const left = deepSignal({ count: 0 });
		const right = signal("initial");
		const callback = vi.fn();
		const controls = trackStop(
			watchIgnorable([left, right] as const, callback, { flush: "sync" }),
		);

		controls.ignoreUpdates(() => {
			left.count = 1;
		});
		right.value = "logged";

		expect(callback).toHaveBeenCalledTimes(1);
		expect(callback).toHaveBeenLastCalledWith(
			[left, "logged"],
			[left, "initial"],
			expect.any(Function),
		);
	});

	it("stops both counting and callback watchers", async () => {
		const source = signal(0);
		const callback = vi.fn();
		const controls = trackStop(watchIgnorable(source, callback));

		source.value = 1;
		controls.stop();
		await nextTick();
		source.value = 2;
		await nextTick();

		expect(callback).not.toHaveBeenCalled();
	});
});
