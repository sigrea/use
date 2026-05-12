// @vitest-environment node

import { computed, signal } from "@sigrea/core";
import { describe, expect, it } from "vitest";

import { useAbs } from "./index";

describe("useAbs", () => {
	it("returns the absolute value of plain numbers", () => {
		expect(useAbs(-1).value).toBe(1);
		expect(useAbs(0).value).toBe(0);
		expect(useAbs(1).value).toBe(1);
	});

	it("accepts signals, computed values, and getter functions", () => {
		const source = signal(-2);
		const doubled = computed(() => source.value * 2);

		expect(useAbs(source).value).toBe(2);
		expect(useAbs(doubled).value).toBe(4);
		expect(useAbs(() => source.value - 1).value).toBe(3);
	});

	it("updates when the source changes", () => {
		const source = signal(-3);
		const result = useAbs(source);

		expect(result.value).toBe(3);

		source.value = 4;
		expect(result.value).toBe(4);

		source.value = -5;
		expect(result.value).toBe(5);
	});
});
