// @vitest-environment node

import {
	createScope,
	disposeScope,
	disposeTrackedMolecules,
	molecule,
	mountMolecule,
	runWithScope,
	signal,
	trackMolecule,
} from "@sigrea/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useTimeoutFn } from "./index";

describe("useTimeoutFn", () => {
	afterEach(() => {
		disposeTrackedMolecules();
		vi.useRealTimers();
	});

	it("runs and stops a timeout", () => {
		vi.useFakeTimers();
		const callback = vi.fn();
		const delay = signal(50);
		const timeout = useTimeoutFn(callback, delay, { immediate: false });

		timeout.start();
		expect(timeout.isPending.value).toBe(true);

		vi.advanceTimersByTime(49);
		expect(callback).not.toHaveBeenCalled();

		vi.advanceTimersByTime(1);
		expect(callback).toHaveBeenCalledTimes(1);
		expect(timeout.isPending.value).toBe(false);

		timeout.start();
		timeout.stop();
		vi.runAllTimers();
		expect(callback).toHaveBeenCalledTimes(1);
	});

	it("can invoke the callback immediately before waiting", () => {
		vi.useFakeTimers();
		const callback = vi.fn();
		const timeout = useTimeoutFn(callback, 50, {
			immediate: false,
			immediateCallback: true,
		});

		timeout.start();
		expect(callback).toHaveBeenCalledTimes(1);
		expect(timeout.isPending.value).toBe(true);

		vi.advanceTimersByTime(50);
		expect(callback).toHaveBeenCalledTimes(2);
		expect(timeout.isPending.value).toBe(false);
	});

	it("starts immediately by default outside molecules", () => {
		vi.useFakeTimers();
		const callback = vi.fn();
		const timeout = useTimeoutFn(callback, 10);

		expect(globalThis.window).toBeUndefined();
		expect(timeout.isPending.value).toBe(true);

		vi.advanceTimersByTime(10);
		expect(callback).toHaveBeenCalledTimes(1);
		expect(timeout.isPending.value).toBe(false);
	});

	it("forwards start arguments to the callback", () => {
		vi.useFakeTimers();
		const callback = vi.fn<(label: string, count: number) => void>();
		const timeout = useTimeoutFn(callback, 10, { immediate: false });

		timeout.start("ready", 2);
		vi.advanceTimersByTime(10);

		expect(callback).toHaveBeenCalledWith("ready", 2);
	});

	it("does not keep running when immediateCallback stops it", () => {
		vi.useFakeTimers();
		let timeout!: ReturnType<typeof useTimeoutFn>;
		const callback = vi.fn(() => {
			timeout.stop();
		});
		const TimeoutMolecule = molecule(() => {
			timeout = useTimeoutFn(callback, 50, {
				immediate: true,
				immediateCallback: true,
			});
			return timeout;
		});
		const instance = TimeoutMolecule();
		trackMolecule(instance);

		mountMolecule(instance);
		expect(callback).toHaveBeenCalledTimes(1);
		expect(instance.isPending.value).toBe(false);

		vi.advanceTimersByTime(100);
		expect(callback).toHaveBeenCalledTimes(1);
	});

	it("cleans up with scope disposal", () => {
		vi.useFakeTimers();
		const callback = vi.fn();
		const scope = createScope();

		runWithScope(scope, () => {
			const timeout = useTimeoutFn(callback, 10, { immediate: true });
			expect(timeout.isPending.value).toBe(true);
		});

		disposeScope(scope);
		vi.runAllTimers();
		expect(callback).not.toHaveBeenCalled();
	});

	it("starts an immediate timeout on molecule mount", () => {
		vi.useFakeTimers();
		const callback = vi.fn();
		const TimeoutMolecule = molecule(() =>
			useTimeoutFn(callback, 10, { immediate: true }),
		);
		const instance = TimeoutMolecule();
		trackMolecule(instance);

		vi.advanceTimersByTime(10);
		expect(callback).not.toHaveBeenCalled();
		expect(instance.isPending.value).toBe(false);

		mountMolecule(instance);
		expect(instance.isPending.value).toBe(true);

		vi.advanceTimersByTime(10);
		expect(callback).toHaveBeenCalledTimes(1);
		expect(instance.isPending.value).toBe(false);
	});
});
