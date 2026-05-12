// @vitest-environment node

import {
	computed,
	createScope,
	disposeScope,
	disposeTrackedMolecules,
	isSignal,
	molecule,
	mountMolecule,
	nextTick,
	runWithScope,
	signal,
	trackMolecule,
	unmountMolecule,
	watchEffect,
} from "@sigrea/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import { resolveValue } from "../resolveValue";
import { signalAutoReset } from "./index";

describe("signalAutoReset", () => {
	afterEach(() => {
		disposeTrackedMolecules();
		vi.useRealTimers();
	});

	it("uses the resolved default value initially", () => {
		const value = signalAutoReset("default", 100);

		expect(value.value).toBe("default");
	});

	it("returns a core signal-compatible value", () => {
		const value = signalAutoReset("default", 100);

		expect(isSignal(value)).toBe(true);
		expect(resolveValue(value)).toBe("default");
	});

	it("updates immediately and resets after the delay", () => {
		vi.useFakeTimers();
		const value = signalAutoReset("default", 100);

		value.value = "updated";
		expect(value.value).toBe("updated");

		vi.advanceTimersByTime(99);
		expect(value.value).toBe("updated");

		vi.advanceTimersByTime(1);
		expect(value.value).toBe("default");
	});

	it("resolves MaybeValue defaults when the reset runs", () => {
		vi.useFakeTimers();
		const fallback = signal("initial");
		const value = signalAutoReset(fallback, 100);

		value.value = "updated";
		fallback.value = "next";
		vi.advanceTimersByTime(100);

		expect(value.value).toBe("next");
	});

	it("resolves MaybeValue getters and computed delays when scheduling", () => {
		vi.useFakeTimers();
		const baseDelay = signal(25);
		const delay = computed(() => baseDelay.value * 2);
		const value = signalAutoReset(() => "default", delay);

		value.value = "updated";
		vi.advanceTimersByTime(49);
		expect(value.value).toBe("updated");

		vi.advanceTimersByTime(1);
		expect(value.value).toBe("default");
	});

	it("does not apply afterMs changes to an already scheduled reset", () => {
		vi.useFakeTimers();
		const delay = signal(150);
		const value = signalAutoReset("default", delay);

		value.value = "first";
		delay.value = 100;

		vi.advanceTimersByTime(100);
		expect(value.value).toBe("first");

		vi.advanceTimersByTime(50);
		expect(value.value).toBe("default");

		value.value = "second";
		vi.advanceTimersByTime(100);
		expect(value.value).toBe("default");
	});

	it("clears the previous timer on consecutive assignments", () => {
		vi.useFakeTimers();
		const value = signalAutoReset("default", 100);

		value.value = "first";
		vi.advanceTimersByTime(50);
		value.value = "second";

		vi.advanceTimersByTime(50);
		expect(value.value).toBe("second");

		vi.advanceTimersByTime(50);
		expect(value.value).toBe("default");
	});

	it("notifies watchEffect on assignment and reset", async () => {
		vi.useFakeTimers();
		const value = signalAutoReset("default", 100);
		const calls: string[] = [];

		watchEffect(() => {
			calls.push(value.value);
		});

		value.value = "updated";
		await nextTick();
		expect(calls).toEqual(["default", "updated"]);

		vi.advanceTimersByTime(100);
		await nextTick();
		expect(calls).toEqual(["default", "updated", "default"]);
	});

	it("cleans up pending resets with scope disposal", () => {
		vi.useFakeTimers();
		const scope = createScope();
		let value!: ReturnType<typeof signalAutoReset<string>>;

		runWithScope(scope, () => {
			value = signalAutoReset("default", 100);
			value.value = "updated";
		});

		disposeScope(scope);
		expect(vi.getTimerCount()).toBe(0);

		vi.advanceTimersByTime(100);
		expect(value.value).toBe("updated");
	});

	it("cleans up pending resets on molecule unmount", () => {
		vi.useFakeTimers();
		const AutoResetMolecule = molecule(() => ({
			value: signalAutoReset("default", 100),
		}));
		const instance = AutoResetMolecule();
		trackMolecule(instance);

		mountMolecule(instance);
		instance.value.value = "updated";
		unmountMolecule(instance);
		expect(vi.getTimerCount()).toBe(0);

		vi.advanceTimersByTime(100);
		expect(instance.value.value).toBe("updated");
	});

	it("can be imported and created without browser globals", async () => {
		const mod = await import("./index");
		const value = mod.signalAutoReset("default", 100);

		expect(globalThis.window).toBeUndefined();
		expect(value.value).toBe("default");
	});
});
