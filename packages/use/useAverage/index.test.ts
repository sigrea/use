// @vitest-environment node

import { signal } from "@sigrea/core";
import { describe, expect, it } from "vitest";

import { useAverage } from "./index";

describe("useAverage", () => {
	it("returns the average of plain rest arguments", () => {
		expect(useAverage(1, 2, 3).value).toBe(2);
		expect(useAverage(-1, 1, 4).value).toBeCloseTo(4 / 3);
	});

	it("accepts a signal array", () => {
		const source = signal([1, 2, 3]);
		const result = useAverage(source);

		expect(result.value).toBe(2);

		source.value = [4, 6];
		expect(result.value).toBe(5);
	});

	it("resolves signals and getters inside an array", () => {
		const left = signal(2);
		const right = signal(4);
		const result = useAverage([left, () => right.value, 6] as const);

		expect(result.value).toBe(4);

		left.value = 8;
		right.value = 10;
		expect(result.value).toBe(8);
	});

	it("accepts getter arrays", () => {
		const source = signal<readonly number[]>([2, 4, 6]);
		const result = useAverage(() => source.value);

		expect(result.value).toBe(4);

		source.value = [6, 8, 10];
		expect(result.value).toBe(8);
	});

	it("updates when rest sources change", () => {
		const left = signal(1);
		const right = signal(3);
		const result = useAverage(left, () => right.value);

		expect(result.value).toBe(2);

		left.value = 5;
		right.value = 7;
		expect(result.value).toBe(6);
	});

	it("keeps JavaScript average behavior for empty input", () => {
		expect(Number.isNaN(useAverage().value)).toBe(true);
		expect(Number.isNaN(useAverage([]).value)).toBe(true);
	});
});
