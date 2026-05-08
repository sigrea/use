// @vitest-environment node

import { signal } from "@sigrea/core";
import { describe, expect, it } from "vitest";

import { useSum } from "./index";

describe("useSum", () => {
	it("returns the sum of plain rest arguments", () => {
		expect(useSum(1, 2, 3).value).toBe(6);
		expect(useSum(-1, 1, 4).value).toBe(4);
	});

	it("accepts a signal array", () => {
		const source = signal([1, 2, 3, 4]);
		const result = useSum(source);

		expect(result.value).toBe(10);

		source.value = [-1, -2, 3, 4];
		expect(result.value).toBe(4);
	});

	it("resolves signals and getters inside an array", () => {
		const left = signal(2);
		const right = signal(4);
		const result = useSum([left, () => right.value, 6] as const);

		expect(result.value).toBe(12);

		left.value = 8;
		right.value = 10;
		expect(result.value).toBe(24);
	});

	it("accepts getter arrays", () => {
		const source = signal<readonly number[]>([2, 4, 6]);
		const result = useSum(() => source.value);

		expect(result.value).toBe(12);

		source.value = [6, 8, 10];
		expect(result.value).toBe(24);
	});

	it("updates when rest sources change", () => {
		const left = signal(1);
		const right = signal(3);
		const result = useSum(left, () => right.value);

		expect(result.value).toBe(4);

		left.value = 5;
		right.value = 7;
		expect(result.value).toBe(12);
	});

	it("keeps VueUse sum behavior for empty input", () => {
		expect(useSum().value).toBe(0);
		expect(useSum([]).value).toBe(0);
	});
});
