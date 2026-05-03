import {
	createScope,
	disposeScope,
	disposeTrackedMolecules,
	molecule,
	mountMolecule,
	runWithScope,
	trackMolecule,
	unmountMolecule,
} from "@sigrea/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useDebounceFn } from "./index";

describe("useDebounceFn", () => {
	afterEach(() => {
		disposeTrackedMolecules();
		vi.useRealTimers();
	});

	it("forwards arguments and this to the delayed callback", async () => {
		vi.useFakeTimers();
		const callback = vi.fn(function (this: { prefix: string }, value: number) {
			return `${this.prefix}${value}`;
		});
		const debounced = useDebounceFn(callback, 20);
		const result = debounced.call({ prefix: "count:" }, 1);

		vi.advanceTimersByTime(19);
		expect(callback).not.toHaveBeenCalled();

		vi.advanceTimersByTime(1);
		await expect(result).resolves.toBe("count:1");
		expect(callback).toHaveBeenCalledTimes(1);
	});

	it("uses a 200ms delay by default", async () => {
		vi.useFakeTimers();
		const callback = vi.fn(() => "done");
		const debounced = useDebounceFn(callback);
		const result = debounced();

		vi.advanceTimersByTime(199);
		expect(callback).not.toHaveBeenCalled();

		vi.advanceTimersByTime(1);
		await expect(result).resolves.toBe("done");
	});

	it("cancels previous calls and resolves them by default", async () => {
		vi.useFakeTimers();
		const callback = vi.fn((value: string) => value);
		const debounced = useDebounceFn(callback, 20);
		const first = debounced("first");

		vi.advanceTimersByTime(10);
		const second = debounced("second");

		await expect(first).resolves.toBeUndefined();

		vi.advanceTimersByTime(20);
		await expect(second).resolves.toBe("second");

		expect(callback).toHaveBeenCalledTimes(1);
		expect(callback).toHaveBeenCalledWith("second");
	});

	it("rejects canceled calls when requested", async () => {
		vi.useFakeTimers();
		const callback = vi.fn((value: string) => value);
		const debounced = useDebounceFn(callback, 20, { rejectOnCancel: true });
		const first = debounced("first");
		const firstRejected = expect(first).rejects.toBeUndefined();

		debounced("second");

		await firstRejected;
		expect(callback).not.toHaveBeenCalled();
	});

	it("invokes with the latest call when maxWait is reached", async () => {
		vi.useFakeTimers();
		const callback = vi.fn((value: string) => value);
		const debounced = useDebounceFn(callback, 50, { maxWait: 100 });

		const first = debounced("first");
		vi.advanceTimersByTime(40);
		const second = debounced("second");
		vi.advanceTimersByTime(40);
		const third = debounced("third");

		await expect(first).resolves.toBeUndefined();
		await expect(second).resolves.toBeUndefined();

		vi.advanceTimersByTime(20);
		await expect(third).resolves.toBe("third");

		expect(callback).toHaveBeenCalledTimes(1);
		expect(callback).toHaveBeenCalledWith("third");
	});

	it("rejects when the delayed callback throws synchronously", async () => {
		vi.useFakeTimers();
		const error = new Error("boom");
		const debounced = useDebounceFn(() => {
			throw error;
		}, 20);
		const result = debounced();

		vi.advanceTimersByTime(20);

		await expect(result).rejects.toBe(error);
	});

	it("cleans up pending timers with scope disposal", async () => {
		vi.useFakeTimers();
		const callback = vi.fn(() => "done");
		const scope = createScope();
		let result!: Promise<string | undefined>;

		runWithScope(scope, () => {
			const debounced = useDebounceFn(callback, 20, { maxWait: 50 });
			result = debounced();
		});

		disposeScope(scope);
		expect(vi.getTimerCount()).toBe(0);

		vi.runAllTimers();
		expect(callback).not.toHaveBeenCalled();
		await expect(result).resolves.toBeUndefined();
	});

	it("cancels pending timers on molecule unmount", async () => {
		vi.useFakeTimers();
		const callback = vi.fn((value: string) => value);
		const DebounceMolecule = molecule(() => ({
			run: useDebounceFn(callback, 20),
		}));
		const instance = DebounceMolecule();
		trackMolecule(instance);

		mountMolecule(instance);
		const result = instance.run("mounted");

		unmountMolecule(instance);
		expect(vi.getTimerCount()).toBe(0);

		vi.advanceTimersByTime(20);
		expect(callback).not.toHaveBeenCalled();
		await expect(result).resolves.toBeUndefined();
	});

	it("rejects pending timers on molecule unmount when cancel rejection is enabled", async () => {
		vi.useFakeTimers();
		const callback = vi.fn((value: string) => value);
		const DebounceMolecule = molecule(() => ({
			run: useDebounceFn(callback, 20, { rejectOnCancel: true }),
		}));
		const instance = DebounceMolecule();
		trackMolecule(instance);

		mountMolecule(instance);
		const result = instance.run("mounted");
		const rejected = expect(result).rejects.toBeUndefined();

		unmountMolecule(instance);
		expect(vi.getTimerCount()).toBe(0);

		vi.advanceTimersByTime(20);
		expect(callback).not.toHaveBeenCalled();
		await rejected;
	});
});
