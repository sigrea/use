// @vitest-environment node

import {
	computed,
	createScope,
	disposeScope,
	disposeTrackedMolecules,
	isSignal,
	molecule,
	mountMolecule,
	readonly,
	runWithScope,
	signal,
	trackMolecule,
	unmountMolecule,
	watchEffect,
} from "@sigrea/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import { resolveValue } from "../resolveValue";
import type { SignalDebouncedOptions } from "../types";
import { signalDebounced } from "./index";

describe("signalDebounced", () => {
	afterEach(() => {
		disposeTrackedMolecules();
		vi.useRealTimers();
	});

	it("uses the source value initially and returns a readonly signal", () => {
		const source = signal("initial");
		const value = signalDebounced(source, 20);
		const descriptor = Object.getOwnPropertyDescriptor(
			Object.getPrototypeOf(value),
			"value",
		);

		expect(value.value).toBe("initial");
		expect(isSignal(value)).toBe(true);
		expect(resolveValue(value)).toBe("initial");
		expect(descriptor?.set).toBeUndefined();
	});

	it("updates after the debounce delay", () => {
		vi.useFakeTimers();
		const source = signal("initial");
		const value = signalDebounced(source, 20);

		source.value = "updated";

		expect(value.value).toBe("initial");
		vi.advanceTimersByTime(19);
		expect(value.value).toBe("initial");

		vi.advanceTimersByTime(1);
		expect(value.value).toBe("updated");
	});

	it("accepts raw values as initial values only", () => {
		vi.useFakeTimers();
		const value = signalDebounced("initial", 20);

		vi.advanceTimersByTime(20);

		expect(value.value).toBe("initial");
	});

	it("does not schedule an initial update for getter object values", () => {
		vi.useFakeTimers();
		const value = signalDebounced(() => ({ count: 1 }), 20);
		const initial = value.value;

		expect(vi.getTimerCount()).toBe(0);

		vi.advanceTimersByTime(20);

		expect(value.value).toBe(initial);
		expect(value.value).toEqual({ count: 1 });
	});

	it("keeps only the latest value across consecutive updates", () => {
		vi.useFakeTimers();
		const source = signal("initial");
		const value = signalDebounced(source, 20);

		source.value = "first";
		vi.advanceTimersByTime(10);
		source.value = "second";

		vi.advanceTimersByTime(19);
		expect(value.value).toBe("initial");

		vi.advanceTimersByTime(1);
		expect(value.value).toBe("second");
	});

	it("cancels pending updates when the source returns to the current value", () => {
		vi.useFakeTimers();
		const source = signal("initial");
		const value = signalDebounced(source, 20);

		source.value = "pending";
		vi.advanceTimersByTime(10);
		source.value = "initial";

		vi.advanceTimersByTime(20);

		expect(value.value).toBe("initial");
	});

	it("ignores runtime rejectOnCancel when tracking pending updates", () => {
		vi.useFakeTimers();
		const source = signal("initial");
		const value = signalDebounced(source, 20, {
			rejectOnCancel: true,
		} as unknown as SignalDebouncedOptions);

		source.value = "first";
		vi.advanceTimersByTime(5);
		source.value = "second";
		vi.advanceTimersByTime(5);
		source.value = "initial";

		vi.advanceTimersByTime(20);

		expect(value.value).toBe("initial");
	});

	it("uses a 200ms delay by default", () => {
		vi.useFakeTimers();
		const source = signal("initial");
		const value = signalDebounced(source);

		source.value = "updated";

		vi.advanceTimersByTime(199);
		expect(value.value).toBe("initial");

		vi.advanceTimersByTime(1);
		expect(value.value).toBe("updated");
	});

	it("accepts MaybeValue delays and computed or getter sources", () => {
		vi.useFakeTimers();
		const base = signal(1);
		const source = computed(() => base.value * 2);
		const delay = signal(50);
		const value = signalDebounced(source, delay);
		const getterValue = signalDebounced(() => base.value * 3, delay);

		base.value = 2;

		vi.advanceTimersByTime(49);
		expect(value.value).toBe(2);

		vi.advanceTimersByTime(1);
		expect(value.value).toBe(4);
		expect(getterValue.value).toBe(6);
	});

	it("resolves maxWait from MaybeValue when scheduling", () => {
		vi.useFakeTimers();
		const source = signal("initial");
		const maxWait = signal(100);
		const value = signalDebounced(source, 50, {
			maxWait: computed(() => maxWait.value),
		});

		source.value = "first";
		vi.advanceTimersByTime(40);
		source.value = "second";
		vi.advanceTimersByTime(40);
		source.value = "third";

		vi.advanceTimersByTime(19);
		expect(value.value).toBe("initial");

		vi.advanceTimersByTime(1);
		expect(value.value).toBe("third");
	});

	it("accepts readonly signal sources", () => {
		vi.useFakeTimers();
		const source = signal("initial");
		const value = signalDebounced(readonly(source), 20);

		source.value = "updated";
		vi.advanceTimersByTime(20);

		expect(value.value).toBe("updated");
	});

	it("holds objects as shallow signal values", () => {
		vi.useFakeTimers();
		const source = signal({ count: 0 });
		const value = signalDebounced(source, 20);
		const calls: number[] = [];

		watchEffect(
			() => {
				calls.push(value.value.count);
			},
			{ flush: "sync" },
		);

		source.value.count = 1;
		vi.advanceTimersByTime(20);
		expect(calls).toEqual([0]);

		source.value = { count: 2 };
		vi.advanceTimersByTime(20);
		expect(calls).toEqual([0, 2]);
	});

	it("cleans up pending updates and source watches with scope disposal", () => {
		vi.useFakeTimers();
		const scope = createScope();
		const source = signal("initial");
		let value!: ReturnType<typeof signalDebounced<string>>;

		runWithScope(scope, () => {
			value = signalDebounced(source, 100);
			source.value = "pending";
		});

		disposeScope(scope);
		expect(vi.getTimerCount()).toBe(0);

		vi.advanceTimersByTime(100);
		expect(value.value).toBe("initial");

		source.value = "after dispose";
		vi.advanceTimersByTime(100);
		expect(value.value).toBe("initial");
		expect(vi.getTimerCount()).toBe(0);
	});

	it("cleans up pending updates and source watches on molecule unmount", () => {
		vi.useFakeTimers();
		const source = signal("initial");
		const DebouncedMolecule = molecule(() => ({
			value: signalDebounced(source, 100),
		}));
		const instance = DebouncedMolecule();
		trackMolecule(instance);

		mountMolecule(instance);
		source.value = "pending";
		unmountMolecule(instance);
		expect(vi.getTimerCount()).toBe(0);

		vi.advanceTimersByTime(100);
		expect(instance.value.value).toBe("initial");

		source.value = "after unmount";
		vi.advanceTimersByTime(100);
		expect(instance.value.value).toBe("initial");
		expect(vi.getTimerCount()).toBe(0);
	});

	it("captures source changes before molecule mount", () => {
		vi.useFakeTimers();
		const source = signal("initial");
		const DebouncedMolecule = molecule(() => ({
			value: signalDebounced(source, 100),
		}));
		const instance = DebouncedMolecule();
		trackMolecule(instance);

		source.value = "before mount";
		mountMolecule(instance);

		vi.advanceTimersByTime(99);
		expect(instance.value.value).toBe("initial");

		vi.advanceTimersByTime(1);
		expect(instance.value.value).toBe("before mount");
	});

	it("does not schedule an initial update on molecule mount", () => {
		vi.useFakeTimers();
		const DebouncedMolecule = molecule(() => ({
			value: signalDebounced(() => ({ count: 1 }), 100),
		}));
		const instance = DebouncedMolecule();
		trackMolecule(instance);
		const initial = instance.value.value;

		mountMolecule(instance);

		expect(vi.getTimerCount()).toBe(0);

		vi.advanceTimersByTime(100);
		expect(instance.value.value).toBe(initial);
		expect(instance.value.value).toEqual({ count: 1 });
	});

	it("does not schedule an unchanged update on molecule remount", () => {
		vi.useFakeTimers();
		const source = signal("initial");
		const DebouncedMolecule = molecule(() => ({
			value: signalDebounced(source, 100),
		}));
		const instance = DebouncedMolecule();
		trackMolecule(instance);

		mountMolecule(instance);
		unmountMolecule(instance);
		expect(vi.getTimerCount()).toBe(0);

		mountMolecule(instance);
		expect(vi.getTimerCount()).toBe(0);

		vi.advanceTimersByTime(100);
		expect(instance.value.value).toBe("initial");
	});

	it("clears pending state synchronously on molecule unmount", () => {
		vi.useFakeTimers();
		const source = signal("initial");
		const DebouncedMolecule = molecule(() => ({
			value: signalDebounced(source, 100),
		}));
		const instance = DebouncedMolecule();
		trackMolecule(instance);

		mountMolecule(instance);
		source.value = "pending";
		expect(vi.getTimerCount()).toBe(1);

		unmountMolecule(instance);
		expect(vi.getTimerCount()).toBe(0);

		source.value = "initial";
		mountMolecule(instance);

		expect(vi.getTimerCount()).toBe(0);

		vi.advanceTimersByTime(100);
		expect(instance.value.value).toBe("initial");
	});

	it("can be imported and created without browser globals", async () => {
		const mod = await import("./index");
		const source = signal("initial");
		const value = mod.signalDebounced(source, 100);

		expect(globalThis.window).toBeUndefined();
		expect(value.value).toBe("initial");
	});
});
