// @vitest-environment node

import { computed, signal } from "@sigrea/core";
import { describe, expect, it } from "vitest";

import { useTrunc } from "./index";

describe("useTrunc", () => {
	it("returns the truncated value of plain numbers", () => {
		expect(useTrunc(1.95).value).toBe(1);
		expect(useTrunc(-7.004).value).toBe(-7);
		expect(useTrunc(2).value).toBe(2);
	});

	it("accepts signals, computed values, and getter functions", () => {
		const source = signal(1.95);
		const doubled = computed(() => source.value * 2);

		expect(useTrunc(source).value).toBe(1);
		expect(useTrunc(doubled).value).toBe(3);
		expect(useTrunc(() => source.value + 2.1).value).toBe(4);
	});

	it("updates when the source changes", () => {
		const source = signal(1.95);
		const result = useTrunc(source);

		expect(result.value).toBe(1);

		source.value = -7.004;
		expect(result.value).toBe(-7);
	});

	it("keeps JavaScript trunc behavior for signed zero and special numbers", () => {
		expect(Object.is(useTrunc(0).value, 0)).toBe(true);
		expect(Object.is(useTrunc(-0).value, -0)).toBe(true);
		expect(useTrunc(0.2).value).toBe(0);
		expect(Object.is(useTrunc(-0.2).value, -0)).toBe(true);
		expect(useTrunc(Number.POSITIVE_INFINITY).value).toBe(
			Number.POSITIVE_INFINITY,
		);
		expect(useTrunc(Number.NEGATIVE_INFINITY).value).toBe(
			Number.NEGATIVE_INFINITY,
		);
		expect(Number.isNaN(useTrunc(Number.NaN).value)).toBe(true);
	});
});
