// @vitest-environment node

import { computed, signal } from "@sigrea/core";
import { describe, expect, it } from "vitest";

import { useFloor } from "./index";

describe("useFloor", () => {
	it("returns the floor of plain numbers", () => {
		expect(useFloor(1.1).value).toBe(1);
		expect(useFloor(2).value).toBe(2);
		expect(useFloor(2.9).value).toBe(2);
	});

	it("accepts signals, computed values, and getter functions", () => {
		const source = signal(1.2);
		const doubled = computed(() => source.value * 2);

		expect(useFloor(source).value).toBe(1);
		expect(useFloor(doubled).value).toBe(2);
		expect(useFloor(() => source.value + 2.9).value).toBe(4);
	});

	it("updates when the source changes", () => {
		const source = signal(1.2);
		const result = useFloor(source);

		expect(result.value).toBe(1);

		source.value = 3.9;
		expect(result.value).toBe(3);

		source.value = 4;
		expect(result.value).toBe(4);
	});

	it("uses JavaScript floor behavior for negative numbers", () => {
		expect(useFloor(-1.2).value).toBe(-2);
		expect(useFloor(-1.8).value).toBe(-2);
		expect(useFloor(-2).value).toBe(-2);
	});
});
