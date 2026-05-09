// @vitest-environment node

import {
	disposeMolecule,
	molecule,
	mountMolecule,
	nextTick,
	signal,
	watchEffect,
} from "@sigrea/core";
import { describe, expect, it, vi } from "vitest";

import { computedEager } from "./index";

describe("computedEager", () => {
	it("evaluates immediately and updates before the value is read", () => {
		const source = signal(0);
		const callback = vi.fn(() => source.value > 0);

		const value = computedEager(callback);

		expect(callback).toHaveBeenCalledTimes(1);
		expect(value.value).toBe(false);

		source.value = 1;

		expect(callback).toHaveBeenCalledTimes(2);
		expect(value.value).toBe(true);
	});

	it("does not notify dependents when the eager result does not change", async () => {
		const source = signal(0);
		const value = computedEager(() => source.value > 0);
		let updates = 0;

		watchEffect(() => {
			value.value;
			updates += 1;
		});

		source.value = 1;
		await nextTick();
		expect(updates).toBe(2);

		source.value = 2;
		await nextTick();
		expect(updates).toBe(2);
	});

	it("passes options to watchEffect while defaulting to sync flush", async () => {
		const source = signal(0);
		const value = computedEager(() => source.value > 0, {
			flush: "pre",
		});

		expect(value.value).toBe(false);

		source.value = 1;
		expect(value.value).toBe(false);

		await nextTick();

		expect(value.value).toBe(true);
	});

	it("has an initial value during molecule setup before mount", () => {
		const useValue = molecule(() => {
			const source = signal(1);
			const value = computedEager(() => source.value * 2);

			return { source, value };
		});

		const instance = useValue();

		expect(instance.value.value).toBe(2);

		instance.source.value = 2;
		expect(instance.value.value).toBe(4);

		mountMolecule(instance);
		instance.source.value = 3;
		expect(instance.value.value).toBe(6);

		disposeMolecule(instance);
	});

	it("can be imported and created without browser globals", async () => {
		const mod = await import("./index");
		const value = mod.computedEager(() => "ready");

		expect(globalThis.window).toBeUndefined();
		expect(value.value).toBe("ready");
	});
});
