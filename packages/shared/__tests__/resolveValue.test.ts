import { computed, signal } from "@sigrea/core";
import { describe, expect, it } from "vitest";

import { resolveValue } from "../resolveValue";

describe("resolveValue", () => {
	it("returns plain values", () => {
		expect(resolveValue("sigrea")).toBe("sigrea");
		expect(resolveValue(42)).toBe(42);
	});

	it("resolves signals, computed values, and getters", () => {
		const count = signal(2);
		const doubled = computed(() => count.value * 2);

		expect(resolveValue(count)).toBe(2);
		expect(resolveValue(doubled)).toBe(4);
		expect(resolveValue(() => count.value + 1)).toBe(3);
	});
});
