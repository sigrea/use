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

import { useThrottleFn } from "./index";

describe("useThrottleFn", () => {
	afterEach(() => {
		disposeTrackedMolecules();
		vi.useRealTimers();
	});

	it("calls on the leading edge and skips trailing calls by default", async () => {
		vi.useFakeTimers();
		const callback = vi.fn((value: string) => value);
		const throttled = useThrottleFn(callback, 20);
		const first = throttled("first");
		const second = throttled("second");

		await expect(first).resolves.toBe("first");
		await expect(second).resolves.toBe("first");
		expect(callback).toHaveBeenCalledTimes(1);

		vi.advanceTimersByTime(20);
		const third = throttled("third");

		await expect(third).resolves.toBe("third");
		expect(callback).toHaveBeenCalledTimes(2);
		expect(callback).toHaveBeenLastCalledWith("third");
	});

	it("runs the latest trailing call when trailing is enabled", async () => {
		vi.useFakeTimers();
		const callback = vi.fn((value: string) => value);
		const throttled = useThrottleFn(callback, 20, true);
		const first = throttled("first");
		const second = throttled("second");

		await expect(first).resolves.toBe("first");
		expect(callback).toHaveBeenCalledTimes(1);

		vi.advanceTimersByTime(20);
		await expect(second).resolves.toBe("second");

		expect(callback).toHaveBeenCalledTimes(2);
		expect(callback).toHaveBeenLastCalledWith("second");
	});

	it("can disable leading calls", async () => {
		vi.useFakeTimers();
		const callback = vi.fn((value: string) => value);
		const throttled = useThrottleFn(callback, 20, true, false);
		const result = throttled("deferred");

		expect(callback).not.toHaveBeenCalled();

		vi.advanceTimersByTime(20);
		await expect(result).resolves.toBe("deferred");

		expect(callback).toHaveBeenCalledTimes(1);
	});

	it("rejects canceled trailing calls when requested", async () => {
		vi.useFakeTimers();
		const callback = vi.fn((value: string) => value);
		const throttled = useThrottleFn(callback, 50, true, true, true);
		const first = throttled("first");

		await expect(first).resolves.toBe("first");

		const second = throttled("second");
		const secondRejected = expect(second).rejects.toBeUndefined();

		vi.advanceTimersByTime(10);
		const third = throttled("third");

		await secondRejected;

		vi.advanceTimersByTime(40);
		await expect(third).resolves.toBe("third");

		expect(callback).toHaveBeenCalledTimes(2);
		expect(callback).toHaveBeenLastCalledWith("third");
	});

	it("rejects when a trailing callback throws synchronously", async () => {
		vi.useFakeTimers();
		const error = new Error("boom");
		const throttled = useThrottleFn(
			() => {
				throw error;
			},
			20,
			true,
			false,
		);
		const result = throttled();

		vi.advanceTimersByTime(20);

		await expect(result).rejects.toBe(error);
	});

	it("cleans up trailing calls with scope disposal", async () => {
		vi.useFakeTimers();
		const callback = vi.fn((value: string) => value);
		const scope = createScope();
		let first!: Promise<string | undefined>;
		let second!: Promise<string | undefined>;

		runWithScope(scope, () => {
			const throttled = useThrottleFn(callback, 20, true);
			first = throttled("first");
			second = throttled("second");
		});

		await expect(first).resolves.toBe("first");
		disposeScope(scope);
		expect(vi.getTimerCount()).toBe(0);

		vi.runAllTimers();
		expect(callback).toHaveBeenCalledTimes(1);
		await expect(second).resolves.toBeUndefined();
	});

	it("cancels trailing calls on molecule unmount", async () => {
		vi.useFakeTimers();
		const callback = vi.fn((value: string) => value);
		const ThrottleMolecule = molecule(() => ({
			run: useThrottleFn(callback, 20, true),
		}));
		const instance = ThrottleMolecule();
		trackMolecule(instance);

		mountMolecule(instance);
		const first = instance.run("first");
		const second = instance.run("second");

		await expect(first).resolves.toBe("first");

		unmountMolecule(instance);
		expect(vi.getTimerCount()).toBe(0);

		vi.advanceTimersByTime(20);
		expect(callback).toHaveBeenCalledTimes(1);
		await expect(second).resolves.toBeUndefined();
	});

	it("rejects trailing calls on molecule unmount when cancel rejection is enabled", async () => {
		vi.useFakeTimers();
		const callback = vi.fn((value: string) => value);
		const ThrottleMolecule = molecule(() => ({
			run: useThrottleFn(callback, 20, true, true, true),
		}));
		const instance = ThrottleMolecule();
		trackMolecule(instance);

		mountMolecule(instance);
		const first = instance.run("first");
		const second = instance.run("second");

		await expect(first).resolves.toBe("first");
		const rejected = expect(second).rejects.toBeUndefined();

		unmountMolecule(instance);
		expect(vi.getTimerCount()).toBe(0);

		vi.advanceTimersByTime(20);
		expect(callback).toHaveBeenCalledTimes(1);
		await rejected;
	});
});
