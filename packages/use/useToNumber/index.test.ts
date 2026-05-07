// @vitest-environment node

import { computed, signal } from "@sigrea/core";
import { describe, expect, it, vi } from "vitest";

import { useToNumber } from "./index";

describe("useToNumber", () => {
	it("converts strings with parseFloat by default and parseInt when requested", () => {
		const value = signal<string | number>("123.345");
		const float = useToNumber(value);
		const int = useToNumber(value, { method: "parseInt" });

		expect(float.value).toBe(123.345);
		expect(int.value).toBe(123);

		value.value = "hi";
		expect(float.value).toBeNaN();
		expect(int.value).toBeNaN();

		value.value = 123.4;
		expect(float.value).toBe(123.4);
		expect(int.value).toBe(123.4);

		value.value = "-43.53";
		expect(float.value).toBe(-43.53);
		expect(int.value).toBe(-43);
	});

	it("passes radix to parseInt", () => {
		const value = signal<string | number>("0xFA");
		const int = useToNumber(value, { method: "parseInt", radix: 16 });

		expect(int.value).toBe(250);
	});

	it("replaces NaN with zero when nanToZero is true", () => {
		const value = signal<string | number>("Hi");
		const float = useToNumber(value, { nanToZero: true });

		expect(float.value).toBe(0);
	});

	it("passes string and number values to a custom method", () => {
		const value = signal<string | number>(`${Number.MAX_SAFE_INTEGER}1`);
		const method = vi.fn((nextValue: string | number) =>
			typeof nextValue === "number" ? nextValue * 2 : 0,
		);
		const result = useToNumber(value, { method });

		expect(result.value).toBe(0);
		expect(method).toHaveBeenLastCalledWith(`${Number.MAX_SAFE_INTEGER}1`);

		value.value = 21;
		expect(result.value).toBe(42);
		expect(method).toHaveBeenLastCalledWith(21);
	});

	it("tracks computed values and getters", () => {
		const source = signal("42.5");
		const multiplier = signal(1);
		const value = computed(
			() => Number.parseFloat(source.value) * multiplier.value,
		);
		const result = useToNumber(() => value.value);

		expect(result.value).toBe(42.5);

		multiplier.value = 2;
		expect(result.value).toBe(85);
	});
});
