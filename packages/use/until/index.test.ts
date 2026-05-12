// @vitest-environment node

import {
	computed,
	deepSignal,
	disposeMolecule,
	molecule,
	mountMolecule,
	nextTick,
	signal,
	trackMolecule,
} from "@sigrea/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { until } from "./index";

describe("until", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("waits until a signal equals a value", async () => {
		const source = signal(0);
		const promise = until(source).toBe(1);

		setTimeout(() => {
			source.value = 1;
		}, 100);
		vi.advanceTimersByTime(100);

		await expect(promise).resolves.toBe(1);
	});

	it("waits until a signal equals another signal", async () => {
		const source = signal(0);
		const expected = signal(2);
		const promise = until(source).toBe(expected);

		source.value = 1;
		await nextTick();

		expected.value = 1;

		await expect(promise).resolves.toBe(1);
	});

	it("supports truthy, undefined, null, and NaN helpers", async () => {
		await expect(until(signal(true)).toBeTruthy()).resolves.toBe(true);
		await expect(until(signal(undefined)).toBeUndefined()).resolves.toBe(
			undefined,
		);
		await expect(until(signal(null)).toBeNull()).resolves.toBe(null);
		await expect(until(signal(Number.NaN)).toBeNaN()).resolves.toBeNaN();
	});

	it("supports negated conditions", async () => {
		const source = signal(0);
		const promise = until(source).not.toBe(0);

		source.value = 1;

		await expect(promise).resolves.toBe(1);
	});

	it("tracks changes and change counts", async () => {
		const source = signal(0);
		const changed = until(source).changed();
		const changedTimes = until(source).changedTimes(3);

		source.value = 1;
		source.value = 2;
		source.value = 3;

		await expect(changed).resolves.toBe(1);
		await expect(changedTimes).resolves.toBe(3);
	});

	it("does not negate change helpers", async () => {
		const source = signal(0);
		const changed = until(source).not.changed();
		const changedTimes = until(source).not.changedTimes(2);
		let changedSettled = false;
		let changedTimesSettled = false;

		changed.then(() => {
			changedSettled = true;
		});
		changedTimes.then(() => {
			changedTimesSettled = true;
		});
		await Promise.resolve();

		expect(changedSettled).toBe(false);
		expect(changedTimesSettled).toBe(false);

		source.value = 1;
		await Promise.resolve();

		expect(changedSettled).toBe(true);
		expect(changedTimesSettled).toBe(false);

		source.value = 2;

		await expect(changed).resolves.toBe(1);
		await expect(changedTimes).resolves.toBe(2);
	});

	it("supports arrays and contains checks", async () => {
		const source = signal([1, 2, 3]);
		const promise = until(source).toContains(4, { deep: true });

		source.value = [...source.value, 4];
		await nextTick();

		await expect(promise).resolves.toEqual([1, 2, 3, 4]);
	});

	it("supports deep signal array contains checks", async () => {
		const source = deepSignal([1, 2, 3]);
		const promise = until(source).toContains(4, { deep: true });

		source.push(4);
		await nextTick();

		await expect(promise).resolves.toEqual([1, 2, 3, 4]);
	});

	it("supports source list contains checks", async () => {
		const source = signal(1);
		const doubled = computed(() => source.value * 2);

		await expect(until([source, doubled]).toContains(2)).resolves.toEqual([
			1, 2,
		]);
	});

	it("supports timeouts", async () => {
		const source = signal(0);
		const promise = until(source).toBe(1, { timeout: 100 });

		vi.advanceTimersByTime(100);

		await expect(promise).resolves.toBe(0);
	});

	it("rejects timeout when requested", async () => {
		const source = signal(0);
		const promise = until(source).toBe(1, {
			timeout: 100,
			throwOnTimeout: true,
		});

		vi.advanceTimersByTime(100);

		await expect(promise).rejects.toBe("Timeout");
	});

	it("accepts getter and computed sources", async () => {
		const source = signal(0);
		const doubled = computed(() => source.value * 2);
		const computedPromise = until(doubled).toBe(4);
		const getterPromise = until(() => source.value).toBe(2);

		source.value = 2;

		await expect(computedPromise).resolves.toBe(4);
		await expect(getterPromise).resolves.toBe(2);
	});

	it("starts timeouts after molecule mount", async () => {
		const UseValue = molecule(() => {
			const source = signal(0);
			const promise = until(source).toBe(1, {
				throwOnTimeout: true,
				timeout: 100,
			});

			return { promise, source };
		});
		const instance = UseValue();
		let settled = false;
		instance.promise.then(
			() => {
				settled = true;
			},
			() => {
				settled = true;
			},
		);
		trackMolecule(instance);

		vi.advanceTimersByTime(100);
		await Promise.resolve();
		expect(settled).toBe(false);

		instance.source.value = 1;
		mountMolecule(instance);

		await expect(instance.promise).resolves.toBe(1);
		disposeMolecule(instance);
	});

	it("times out from molecule mount time", async () => {
		const UseValue = molecule(() => {
			const source = signal(0);
			const promise = until(source).toBe(1, {
				throwOnTimeout: true,
				timeout: 100,
			});

			return { promise };
		});
		const instance = UseValue();
		const result = instance.promise.then(
			() => "resolved",
			(error: unknown) => error,
		);
		let settled = false;
		result.then(() => {
			settled = true;
		});
		trackMolecule(instance);

		vi.advanceTimersByTime(100);
		await Promise.resolve();
		expect(settled).toBe(false);

		mountMolecule(instance);
		vi.advanceTimersByTime(99);
		await Promise.resolve();
		expect(settled).toBe(false);

		vi.advanceTimersByTime(1);
		await expect(result).resolves.toBe("Timeout");
		disposeMolecule(instance);
	});

	it("rechecks deferred watches on molecule mount", async () => {
		const UseValue = molecule(() => {
			const source = signal(0);
			const promise = until(source).toBe(1);

			return { promise, source };
		});
		const instance = UseValue();
		trackMolecule(instance);

		instance.source.value = 1;
		mountMolecule(instance);

		await expect(instance.promise).resolves.toBe(1);
		disposeMolecule(instance);
	});

	it("does not count molecule mount as a change", async () => {
		const UseValue = molecule(() => {
			const source = signal(0);
			const promise = until(source).changed();
			const negatedPromise = until(source).not.changed();

			return { negatedPromise, promise, source };
		});
		const instance = UseValue();
		let settled = false;
		let negatedSettled = false;
		instance.promise.then(() => {
			settled = true;
		});
		instance.negatedPromise.then(() => {
			negatedSettled = true;
		});
		trackMolecule(instance);

		mountMolecule(instance);
		await Promise.resolve();
		expect(settled).toBe(false);
		expect(negatedSettled).toBe(false);

		instance.source.value = 1;
		await expect(instance.promise).resolves.toBe(1);
		await expect(instance.negatedPromise).resolves.toBe(1);
		disposeMolecule(instance);
	});

	it("stops watching after resolving", async () => {
		const source = signal(0);
		let calls = 0;
		const promise = until(source).toMatch((value) => {
			calls += 1;
			return value === 1;
		});

		source.value = 1;
		await expect(promise).resolves.toBe(1);

		source.value = 2;
		await nextTick();

		expect(calls).toBe(2);
	});
});
