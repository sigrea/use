// @vitest-environment node

import { signal } from "@sigrea/core";
import { describe, expect, it } from "vitest";

import { usePrecision } from "./index";

describe("usePrecision", () => {
	it("rounds to the requested precision by default", () => {
		const source = signal(45.125);
		const result = usePrecision(source, 2);
		const emptyOptions = usePrecision(source, 2, {});

		expect(result.value).toBe(45.13);
		expect(emptyOptions.value).toBe(45.13);

		source.value = -45.155;
		expect(result.value).toBe(-45.15);
		expect(emptyOptions.value).toBe(-45.15);
	});

	it("rounds positive half-step decimals at the requested precision", () => {
		const source = signal(1.005);
		const result = usePrecision(source, 2);

		expect(result.value).toBe(1.01);

		source.value = 2.675;
		expect(result.value).toBe(2.68);
	});

	it("supports ceil rounding", () => {
		const source = signal(45.125);
		const result = usePrecision(source, 2, { math: "ceil" });

		expect(result.value).toBe(45.13);

		source.value = -45.151;
		expect(result.value).toBe(-45.15);
	});

	it("supports floor rounding", () => {
		const source = signal(45.129);
		const result = usePrecision(source, 2, { math: "floor" });

		expect(result.value).toBe(45.12);

		source.value = -45.159;
		expect(result.value).toBe(-45.16);

		source.value = 2.3;
		expect(result.value).toBe(2.3);

		source.value = -2.3;
		expect(result.value).toBe(-2.3);
	});

	it("tracks value, digits, and options sources", () => {
		const source = signal(1.234);
		const digits = signal(2);
		const options = signal<{ math: "floor" | "ceil" | "round" }>({
			math: "round",
		});
		const result = usePrecision(source, digits, options);

		expect(result.value).toBe(1.23);

		digits.value = 1;
		expect(result.value).toBe(1.2);

		options.value = { math: "ceil" };
		expect(result.value).toBe(1.3);

		source.value = 1.21;
		expect(result.value).toBe(1.3);
	});

	it("accepts getter options", () => {
		const method = signal<"floor" | "round">("floor");
		const result = usePrecision(12.3456, 3, () => ({ math: method.value }));

		expect(result.value).toBe(12.345);

		method.value = "round";
		expect(result.value).toBe(12.346);
	});
});
