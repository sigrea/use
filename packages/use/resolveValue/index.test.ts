// @vitest-environment node

import { computed, readonly, signal } from "@sigrea/core";
import { describe, expect, it } from "vitest";

import { resolveValue } from "./index";

describe("resolveValue", () => {
	it("resolves raw values, signals, readonly signals, computed values, and getters", () => {
		const count = signal(2);
		const readonlyCount = readonly(count);
		const doubled = computed(() => count.value * 2);

		expect(resolveValue("sigrea")).toBe("sigrea");
		expect(resolveValue(count)).toBe(2);
		expect(resolveValue(readonlyCount)).toBe(2);
		expect(resolveValue(doubled)).toBe(4);
		expect(resolveValue(() => count.value + 1)).toBe(3);
	});

	it("keeps signal-wrapped function values and calls direct functions as getters", () => {
		const factory = () => "ready";
		const wrappedFactory = signal(factory);

		expect(resolveValue(wrappedFactory)).toBe(factory);
		expect(resolveValue(factory)).toBe("ready");
	});

	it("does not recursively resolve returned values", () => {
		const value = signal("ready");
		const getter = () => value;

		expect(resolveValue(getter)).toBe(value);
	});
});
