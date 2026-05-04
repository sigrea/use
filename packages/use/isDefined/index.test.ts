// @vitest-environment node

import { computed, readonly, signal } from "@sigrea/core";
import { describe, expect, it, vi } from "vitest";

import { isDefined } from "./index";

describe("isDefined", () => {
	it("checks raw values", () => {
		expect(isDefined("sigrea")).toBe(true);
		expect(isDefined(0)).toBe(true);
		expect(isDefined(false)).toBe(true);
		expect(isDefined(null)).toBe(false);
		expect(isDefined(undefined)).toBe(false);
	});

	it("checks signals", () => {
		const defined = signal("ready");
		const empty = signal<string | undefined>();
		const nullable = signal<string | null>(null);

		expect(isDefined(defined)).toBe(true);
		expect(isDefined(empty)).toBe(false);
		expect(isDefined(nullable)).toBe(false);
	});

	it("checks readonly signals", () => {
		const defined = readonly(signal("ready"));
		const empty = readonly(signal<string | undefined>());
		const nullable = readonly(signal<string | null>(null));

		expect(isDefined(defined)).toBe(true);
		expect(isDefined(empty)).toBe(false);
		expect(isDefined(nullable)).toBe(false);
	});

	it("checks computed values", () => {
		const count = signal(1);
		const defined = computed(() => `ready:${count.value}`);
		const empty = computed((): string | undefined => undefined);
		const nullable = computed((): string | null => null);

		expect(isDefined(defined)).toBe(true);
		expect(isDefined(empty)).toBe(false);
		expect(isDefined(nullable)).toBe(false);

		count.value = 2;

		expect(isDefined(defined)).toBe(true);
	});

	it("checks zero-argument getters and wrapped function values", () => {
		const fn = vi.fn(() => undefined);
		const definedGetter = vi.fn(() => "ready");
		const getterReturningSignal = vi.fn(() => signal(undefined));
		const wrapped = signal(fn);

		expect(isDefined(fn)).toBe(false);
		expect(isDefined(definedGetter)).toBe(true);
		expect(isDefined(getterReturningSignal)).toBe(true);
		expect(isDefined(wrapped)).toBe(true);
		expect(fn).toHaveBeenCalledTimes(1);
		expect(definedGetter).toHaveBeenCalledTimes(1);
		expect(getterReturningSignal).toHaveBeenCalledTimes(1);
	});

	it("can be imported and used without browser globals", async () => {
		const mod = await import("./index");
		const value = signal("ready");

		expect(globalThis.window).toBeUndefined();
		expect(mod.isDefined(value)).toBe(true);
	});
});
