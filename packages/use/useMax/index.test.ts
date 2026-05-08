// @vitest-environment node

import { signal } from "@sigrea/core";
import { describe, expect, it } from "vitest";

import { useMax } from "./index";

describe("useMax", () => {
	it("returns the maximum of plain rest arguments", () => {
		expect(useMax(1, 2, 3).value).toBe(3);
		expect(useMax(-1, 1, 4).value).toBe(4);
	});

	it("accepts a signal array", () => {
		const source = signal([1, 2, 3]);
		const result = useMax(source);

		expect(result.value).toBe(3);

		source.value = [4, 6];
		expect(result.value).toBe(6);
	});

	it("resolves signals and getters inside an array", () => {
		const left = signal(2);
		const right = signal(4);
		const result = useMax([left, () => right.value, 6] as const);

		expect(result.value).toBe(6);

		left.value = 8;
		right.value = 10;
		expect(result.value).toBe(10);
	});

	it("accepts getter arrays", () => {
		const source = signal<readonly number[]>([2, 4, 6]);
		const result = useMax(() => source.value);

		expect(result.value).toBe(6);

		source.value = [6, 8, 10];
		expect(result.value).toBe(10);
	});

	it("updates when rest sources change", () => {
		const left = signal(1);
		const right = signal(3);
		const result = useMax(left, () => right.value);

		expect(result.value).toBe(3);

		left.value = 5;
		right.value = 7;
		expect(result.value).toBe(7);
	});

	it("keeps JavaScript max behavior for empty input", () => {
		expect(useMax().value).toBe(Number.NEGATIVE_INFINITY);
		expect(useMax([]).value).toBe(Number.NEGATIVE_INFINITY);
	});
});
