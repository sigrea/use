// @vitest-environment node

import { computed, signal } from "@sigrea/core";
import { describe, expect, it } from "vitest";

import { useCeil } from "./index";

describe("useCeil", () => {
	it("returns the ceiling of plain numbers", () => {
		expect(useCeil(1.1).value).toBe(2);
		expect(useCeil(2).value).toBe(2);
		expect(useCeil(2.9).value).toBe(3);
	});

	it("accepts signals, computed values, and getter functions", () => {
		const source = signal(1.2);
		const doubled = computed(() => source.value * 2);

		expect(useCeil(source).value).toBe(2);
		expect(useCeil(doubled).value).toBe(3);
		expect(useCeil(() => source.value + 2.1).value).toBe(4);
	});

	it("updates when the source changes", () => {
		const source = signal(1.2);
		const result = useCeil(source);

		expect(result.value).toBe(2);

		source.value = 3.1;
		expect(result.value).toBe(4);

		source.value = 4;
		expect(result.value).toBe(4);
	});

	it("uses JavaScript ceiling behavior for negative numbers", () => {
		expect(useCeil(-1.2).value).toBe(-1);
		expect(useCeil(-1.8).value).toBe(-1);
		expect(useCeil(-2).value).toBe(-2);
	});
});
