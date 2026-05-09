// @vitest-environment node

import {
	createScope,
	disposeScope,
	disposeTrackedMolecules,
	runWithScope,
	signal,
	watchEffect,
} from "@sigrea/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import { computedAsync } from "./index";

interface Deferred<T> {
	promise: Promise<T>;
	reject(error: unknown): void;
	resolve(value: T): void;
}

function createDeferred<T>(): Deferred<T> {
	let reject!: (error: unknown) => void;
	let resolve!: (value: T) => void;
	const promise = new Promise<T>((resolvePromise, rejectPromise) => {
		resolve = resolvePromise;
		reject = rejectPromise;
	});

	return { promise, reject, resolve };
}

async function flushPromises(): Promise<void> {
	await Promise.resolve();
	await Promise.resolve();
}

describe("computedAsync", () => {
	afterEach(() => {
		disposeTrackedMolecules();
	});

	it("returns the initial state until the first evaluation resolves", async () => {
		const deferred = createDeferred<string>();
		const value = computedAsync(() => deferred.promise, "initial");

		expect(value.value).toBe("initial");

		deferred.resolve("ready");
		await flushPromises();

		expect(value.value).toBe("ready");
	});

	it("returns undefined until the first evaluation resolves when no initial state is passed", async () => {
		const deferred = createDeferred<string>();
		const value = computedAsync(() => deferred.promise);

		expect(value.value).toBeUndefined();

		deferred.resolve("ready");
		await flushPromises();

		expect(value.value).toBe("ready");
	});

	it("reevaluates when dependencies read by the callback change", async () => {
		const source = signal("first");
		const value = computedAsync(async () => `value:${source.value}`, "initial");

		await flushPromises();
		expect(value.value).toBe("value:first");

		source.value = "second";
		await flushPromises();

		expect(value.value).toBe("value:second");
	});

	it("cancels the previous evaluation and discards its result", async () => {
		const source = signal(1);
		const first = createDeferred<number>();
		const second = createDeferred<number>();
		const canceled: number[] = [];
		const value = computedAsync(async (onCancel) => {
			const currentSource = source.value;
			onCancel(() => {
				canceled.push(currentSource);
			});
			return currentSource === 1 ? first.promise : second.promise;
		}, 0);

		source.value = 2;

		expect(canceled).toEqual([1]);

		first.resolve(1);
		await flushPromises();
		expect(value.value).toBe(0);

		second.resolve(2);
		await flushPromises();
		expect(value.value).toBe(2);
	});

	it("keeps evaluating true until the latest evaluation resolves", async () => {
		const source = signal(1);
		const first = createDeferred<number>();
		const second = createDeferred<number>();
		const evaluating = signal(false);
		const observedEvaluating: boolean[] = [];
		watchEffect(
			() => {
				observedEvaluating.push(evaluating.value);
			},
			{ flush: "sync" },
		);
		const value = computedAsync(
			() => (source.value === 1 ? first.promise : second.promise),
			0,
			evaluating,
		);

		expect(evaluating.value).toBe(true);
		expect(observedEvaluating).toEqual([false, true]);

		source.value = 2;
		expect(evaluating.value).toBe(true);
		expect(observedEvaluating).toEqual([false, true]);

		first.resolve(1);
		await flushPromises();
		expect(evaluating.value).toBe(true);
		expect(value.value).toBe(0);

		second.resolve(2);
		await flushPromises();
		expect(value.value).toBe(2);
		expect(evaluating.value).toBe(false);
		expect(observedEvaluating).toEqual([false, true, false]);
	});

	it("tracks evaluating from options", async () => {
		const deferred = createDeferred<string>();
		const evaluating = signal(false);
		const value = computedAsync(() => deferred.promise, "initial", {
			evaluating,
		});

		expect(evaluating.value).toBe(true);

		deferred.resolve("ready");
		await flushPromises();

		expect(value.value).toBe("ready");
		expect(evaluating.value).toBe(false);
	});

	it("starts lazy evaluation on first access", async () => {
		const callback = vi.fn(async () => "ready");
		const value = computedAsync(callback, "initial", { lazy: true });

		expect(callback).not.toHaveBeenCalled();
		expect(value.value).toBe("initial");
		expect(callback).toHaveBeenCalledTimes(1);

		await flushPromises();
		expect(value.value).toBe("ready");
	});

	it("passes evaluation errors to onError and keeps the current value", async () => {
		const error = new Error("failed");
		const onError = vi.fn();
		const value = computedAsync(
			async () => {
				throw error;
			},
			"initial",
			{ onError },
		);

		await flushPromises();

		expect(onError).toHaveBeenCalledWith(error);
		expect(value.value).toBe("initial");
	});

	it("falls back to console.error when reportError is unavailable", async () => {
		const originalReportError = Object.getOwnPropertyDescriptor(
			globalThis,
			"reportError",
		);
		Object.defineProperty(globalThis, "reportError", {
			configurable: true,
			value: undefined,
		});
		const consoleError = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});
		const error = new Error("failed");

		try {
			const value = computedAsync(async () => {
				throw error;
			}, "initial");

			await flushPromises();

			expect(consoleError).toHaveBeenCalledWith(error);
			expect(value.value).toBe("initial");
		} finally {
			consoleError.mockRestore();
			if (originalReportError === undefined) {
				Reflect.deleteProperty(globalThis, "reportError");
			} else {
				Object.defineProperty(globalThis, "reportError", originalReportError);
			}
		}
	});

	it("tracks nested result changes when shallow is false", async () => {
		const deferred = createDeferred<{ nested: { count: number } }>();
		const value = computedAsync(
			() => deferred.promise,
			{ nested: { count: 0 } },
			{
				shallow: false,
			},
		);
		let observed = 0;
		watchEffect(() => {
			observed = value.value.nested.count;
		});

		deferred.resolve({ nested: { count: 1 } });
		await flushPromises();
		expect(observed).toBe(1);

		value.value.nested.count = 2;
		await flushPromises();
		expect(observed).toBe(2);
	});

	it("runs cancel callbacks when the owning scope is disposed", () => {
		const scope = createScope();
		const deferred = createDeferred<string>();
		const evaluating = signal(false);
		const cancel = vi.fn();

		runWithScope(scope, () => {
			computedAsync(
				(onCancel) => {
					onCancel(cancel);
					return deferred.promise;
				},
				"initial",
				evaluating,
			);
		});

		expect(evaluating.value).toBe(true);

		disposeScope(scope);

		expect(cancel).toHaveBeenCalledTimes(1);
		return flushPromises().then(() => {
			expect(evaluating.value).toBe(false);
		});
	});

	it("can be imported and created without browser globals", async () => {
		const mod = await import("./index");
		const value = mod.computedAsync(async () => "ready", "initial");

		expect(globalThis.window).toBeUndefined();
		expect(value.value).toBe("initial");
	});
});
