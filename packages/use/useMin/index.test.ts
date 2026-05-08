// @vitest-environment node

import { signal } from "@sigrea/core";
import { describe, expect, it } from "vitest";

import { useMin } from "./index";

describe("useMin", () => {
	it("returns the minimum of plain rest arguments", () => {
		expect(useMin(1, 2, 3).value).toBe(1);
		expect(useMin(-1, 1, 4).value).toBe(-1);
	});

	it("accepts a signal array", () => {
		const source = signal([1, 2, 3]);
		const result = useMin(source);

		expect(result.value).toBe(1);

		source.value = [4, 6];
		expect(result.value).toBe(4);
	});

	it("resolves signals and getters inside an array", () => {
		const left = signal(2);
		const right = signal(4);
		const result = useMin([left, () => right.value, 6] as const);

		expect(result.value).toBe(2);

		left.value = 8;
		right.value = 10;
		expect(result.value).toBe(6);
	});

	it("accepts getter arrays", () => {
		const source = signal<readonly number[]>([2, 4, 6]);
		const result = useMin(() => source.value);

		expect(result.value).toBe(2);

		source.value = [6, 8, 10];
		expect(result.value).toBe(6);
	});

	it("updates when rest sources change", () => {
		const left = signal(1);
		const right = signal(3);
		const result = useMin(left, () => right.value);

		expect(result.value).toBe(1);

		left.value = 5;
		right.value = 7;
		expect(result.value).toBe(5);
	});

	it("keeps JavaScript min behavior for empty input", () => {
		expect(useMin().value).toBe(Number.POSITIVE_INFINITY);
		expect(useMin([]).value).toBe(Number.POSITIVE_INFINITY);
	});
});
