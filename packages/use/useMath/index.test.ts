// @vitest-environment node

import { computed, signal } from "@sigrea/core";
import { describe, expect, it } from "vitest";

import { useMath } from "./index";

describe("useMath", () => {
	it("accepts plain number arguments", () => {
		expect(useMath("pow", 2, 3).value).toBe(8);
	});

	it("tracks signal, computed, and getter arguments", () => {
		const base = signal(2);
		const exponent = computed(() => base.value + 1);
		const result = useMath("pow", base, () => exponent.value);

		expect(result.value).toBe(8);

		base.value = 3;
		expect(result.value).toBe(81);
	});

	it("supports single argument methods", () => {
		const value = signal(4);
		const result = useMath("sqrt", value);

		expect(result.value).toBe(2);

		value.value = 16;
		expect(result.value).toBe(4);
	});

	it("supports rest argument methods", () => {
		const first = signal(1);
		const second = signal(2);
		const third = computed(() => second.value + 1);
		const result = useMath("max", first, () => second.value, third);

		expect(result.value).toBe(3);

		first.value = 10;
		expect(result.value).toBe(10);

		second.value = 20;
		expect(result.value).toBe(21);
	});
});
