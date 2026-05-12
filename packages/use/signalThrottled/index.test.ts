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
import { signalThrottled } from "./index";

describe("signalThrottled", () => {
	afterEach(() => {
		disposeTrackedMolecules();
		vi.useRealTimers();
	});

	it("uses the source value initially and returns a readonly signal", () => {
		const source = signal("initial");
		const value = signalThrottled(source, 20);
		const descriptor = Object.getOwnPropertyDescriptor(
			Object.getPrototypeOf(value),
			"value",
		);

		expect(value.value).toBe("initial");
		expect(isSignal(value)).toBe(true);
		expect(resolveValue(value)).toBe("initial");
		expect(descriptor?.set).toBeUndefined();
	});

	it("updates on the leading edge and keeps the latest trailing value by default", () => {
		vi.useFakeTimers();
		const source = signal("initial");
		const value = signalThrottled(source, 20);

		source.value = "first";
		expect(value.value).toBe("first");

		source.value = "second";
		vi.advanceTimersByTime(10);
		source.value = "third";

		vi.advanceTimersByTime(9);
		expect(value.value).toBe("first");

		vi.advanceTimersByTime(1);
		expect(value.value).toBe("third");
	});

	it("can disable trailing updates", () => {
		vi.useFakeTimers();
		const source = signal("initial");
		const value = signalThrottled(source, 20, false);

		source.value = "first";
		source.value = "second";

		expect(value.value).toBe("first");
		vi.advanceTimersByTime(20);
		expect(value.value).toBe("first");

		source.value = "third";
		expect(value.value).toBe("third");
	});

	it("can disable leading updates", () => {
		vi.useFakeTimers();
		const source = signal("initial");
		const value = signalThrottled(source, 20, true, false);

		source.value = "first";
		expect(value.value).toBe("initial");

		vi.advanceTimersByTime(10);
		source.value = "second";
		vi.advanceTimersByTime(9);
		expect(value.value).toBe("initial");

		vi.advanceTimersByTime(1);
		expect(value.value).toBe("second");
	});

	it("keeps the current value when a pending trailing update returns to it", () => {
		vi.useFakeTimers();
		const source = signal("initial");
		const value = signalThrottled(source, 20);

		source.value = "first";
		source.value = "second";
		source.value = "first";

		vi.advanceTimersByTime(20);

		expect(value.value).toBe("first");
	});

	it("uses a 200ms delay by default", () => {
		vi.useFakeTimers();
		const source = signal("initial");
		const value = signalThrottled(source);

		source.value = "first";
		source.value = "second";

		vi.advanceTimersByTime(199);
		expect(value.value).toBe("first");

		vi.advanceTimersByTime(1);
		expect(value.value).toBe("second");
	});

	it("accepts MaybeValue delays and computed or getter sources", () => {
		vi.useFakeTimers();
		const base = signal(1);
		const source = computed(() => base.value * 2);
		const delay = signal(50);
		const value = signalThrottled(source, delay);
		const getterValue = signalThrottled(() => base.value * 3, delay);

		base.value = 2;
		delay.value = 20;
		base.value = 3;

		vi.advanceTimersByTime(19);
		expect(value.value).toBe(4);
		expect(getterValue.value).toBe(6);

		vi.advanceTimersByTime(1);
		expect(value.value).toBe(6);
		expect(getterValue.value).toBe(9);
	});

	it("accepts raw values as initial values only", () => {
		vi.useFakeTimers();
		const value = signalThrottled("initial", 20);

		vi.advanceTimersByTime(20);

		expect(value.value).toBe("initial");
	});

	it("does not schedule an initial update for getter object values", () => {
		vi.useFakeTimers();
		const value = signalThrottled(() => ({ count: 1 }), 20);
		const initial = value.value;

		expect(vi.getTimerCount()).toBe(0);

		vi.advanceTimersByTime(20);

		expect(value.value).toBe(initial);
		expect(value.value).toEqual({ count: 1 });
	});

	it("accepts readonly signal sources", () => {
		vi.useFakeTimers();
		const source = signal("initial");
		const value = signalThrottled(readonly(source), 20);

		source.value = "updated";

		expect(value.value).toBe("updated");
	});

	it("updates immediately when the delay resolves to zero", () => {
		vi.useFakeTimers();
		const source = signal("initial");
		const delay = signal(0);
		const value = signalThrottled(source, delay);

		source.value = "updated";
		vi.advanceTimersByTime(0);

		expect(value.value).toBe("updated");
	});

	it("holds objects as shallow signal values", () => {
		vi.useFakeTimers();
		const source = signal({ count: 0 });
		const value = signalThrottled(source, 20);
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
		expect(calls).toEqual([0, 2]);
	});

	it("cleans up pending updates and source watches with scope disposal", () => {
		vi.useFakeTimers();
		const scope = createScope();
		const source = signal("initial");
		let value!: ReturnType<typeof signalThrottled<string>>;

		runWithScope(scope, () => {
			value = signalThrottled(source, 100);
			source.value = "first";
			source.value = "pending";
		});

		disposeScope(scope);
		expect(vi.getTimerCount()).toBe(0);

		vi.advanceTimersByTime(100);
		expect(value.value).toBe("first");

		source.value = "after dispose";
		vi.advanceTimersByTime(100);
		expect(value.value).toBe("first");
		expect(vi.getTimerCount()).toBe(0);
	});

	it("cleans up pending updates and source watches on molecule unmount", () => {
		vi.useFakeTimers();
		const source = signal("initial");
		const ThrottledMolecule = molecule(() => ({
			value: signalThrottled(source, 100),
		}));
		const instance = ThrottledMolecule();
		trackMolecule(instance);

		mountMolecule(instance);
		source.value = "first";
		source.value = "pending";
		unmountMolecule(instance);
		expect(vi.getTimerCount()).toBe(0);

		vi.advanceTimersByTime(100);
		expect(instance.value.value).toBe("first");

		source.value = "after unmount";
		vi.advanceTimersByTime(100);
		expect(instance.value.value).toBe("first");
		expect(vi.getTimerCount()).toBe(0);
	});

	it("does not schedule an initial update on molecule mount", () => {
		vi.useFakeTimers();
		const ThrottledMolecule = molecule(() => ({
			value: signalThrottled(() => ({ count: 1 }), 100),
		}));
		const instance = ThrottledMolecule();
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
		const ThrottledMolecule = molecule(() => ({
			value: signalThrottled(source, 100),
		}));
		const instance = ThrottledMolecule();
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
		const ThrottledMolecule = molecule(() => ({
			value: signalThrottled(source, 100),
		}));
		const instance = ThrottledMolecule();
		trackMolecule(instance);

		mountMolecule(instance);
		source.value = "first";
		source.value = "pending";
		expect(vi.getTimerCount()).toBe(1);

		unmountMolecule(instance);
		expect(vi.getTimerCount()).toBe(0);

		source.value = "first";
		mountMolecule(instance);

		expect(vi.getTimerCount()).toBe(0);

		vi.advanceTimersByTime(100);
		expect(instance.value.value).toBe("first");
	});

	it("can be imported and created without browser globals", async () => {
		const mod = await import("./index");
		const source = signal("initial");
		const value = mod.signalThrottled(source, 100);

		expect(globalThis.window).toBeUndefined();
		expect(value.value).toBe("initial");
	});
});
