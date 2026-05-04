// @vitest-environment node

import {
	computed,
	isSignal,
	nextTick,
	signal,
	watchEffect,
} from "@sigrea/core";
import { describe, expect, it } from "vitest";

import { resolveValue } from "../resolveValue";
import { signalManualReset } from "./index";

describe("signalManualReset", () => {
	it("uses the resolved default value initially", () => {
		const value = signalManualReset("default");

		expect(value.value).toBe("default");
	});

	it("returns a core signal-compatible value with reset controls", () => {
		const value = signalManualReset("default");

		expect(isSignal(value)).toBe(true);
		expect(typeof value.reset).toBe("function");
		expect(resolveValue(value)).toBe("default");
	});

	it("updates immediately and resets manually", () => {
		const value = signalManualReset("default");

		value.value = "updated";
		expect(value.value).toBe("updated");

		value.reset();
		expect(value.value).toBe("default");
	});

	it("resolves MaybeValue defaults when reset runs", () => {
		const fallback = signal("initial");
		const value = signalManualReset(fallback);

		value.value = "updated";
		fallback.value = "next";
		expect(value.value).toBe("updated");

		value.reset();

		expect(value.value).toBe("next");
	});

	it("resolves getters and computed defaults", () => {
		const base = signal(1);
		const fallback = computed(() => `default:${base.value}`);
		const value = signalManualReset(() => fallback.value);

		value.value = "updated";
		base.value = 2;
		value.reset();

		expect(value.value).toBe("default:2");
	});

	it("notifies watchEffect on assignment and reset", async () => {
		const value = signalManualReset("default");
		const calls: string[] = [];

		watchEffect(() => {
			calls.push(value.value);
		});

		value.value = "updated";
		await nextTick();
		value.reset();
		await nextTick();

		expect(calls).toEqual(["default", "updated", "default"]);
	});

	it("keeps object values shallow", async () => {
		const value = signalManualReset({ count: 0 });
		const calls: number[] = [];

		watchEffect(() => {
			calls.push(value.value.count);
		});

		value.value.count = 1;
		await nextTick();
		expect(calls).toEqual([0]);

		value.value = { count: 2 };
		await nextTick();
		expect(calls).toEqual([0, 2]);
	});

	it("keeps wrapped function values as values", () => {
		const fallback = () => "default";
		const updated = () => "updated";
		const value = signalManualReset(signal(fallback));

		value.value = updated;
		expect(value.value).toBe(updated);

		value.reset();
		expect(value.value).toBe(fallback);
		expect(value.value()).toBe("default");
	});

	it("keeps getter-returned function values as values", () => {
		const fallback = () => "default";
		const updated = () => "updated";
		const value = signalManualReset(() => fallback);

		expect(value.value).toBe(fallback);

		value.value = updated;
		expect(value.value).toBe(updated);

		value.reset();
		expect(value.value).toBe(fallback);
		expect(value.value()).toBe("default");
	});

	it("uses raw zero-argument functions as getters", () => {
		const value = signalManualReset(() => "default");

		expect(value.value).toBe("default");
	});

	it("can be imported and created without browser globals", async () => {
		const mod = await import("./index");
		const value = mod.signalManualReset("default");

		expect(globalThis.window).toBeUndefined();
		expect(value.value).toBe("default");
	});
});
