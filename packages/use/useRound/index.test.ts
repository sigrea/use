// @vitest-environment node

import { computed, signal } from "@sigrea/core";
import { describe, expect, it } from "vitest";

import { useRound } from "./index";

describe("useRound", () => {
	it("returns the rounded value of plain numbers", () => {
		expect(useRound(1.1).value).toBe(1);
		expect(useRound(1.5).value).toBe(2);
		expect(useRound(2).value).toBe(2);
	});

	it("accepts signals, computed values, and getter functions", () => {
		const source = signal(1.2);
		const doubled = computed(() => source.value * 2);

		expect(useRound(source).value).toBe(1);
		expect(useRound(doubled).value).toBe(2);
		expect(useRound(() => source.value + 2.3).value).toBe(4);
	});

	it("updates when the source changes", () => {
		const source = signal(1.2);
		const result = useRound(source);

		expect(result.value).toBe(1);

		source.value = 3.5;
		expect(result.value).toBe(4);

		source.value = 4;
		expect(result.value).toBe(4);
	});

	it("uses JavaScript round behavior for negative numbers", () => {
		expect(useRound(-1.2).value).toBe(-1);
		expect(useRound(-1.8).value).toBe(-2);
		expect(useRound(-2).value).toBe(-2);
	});
});
