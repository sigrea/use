// @vitest-environment node

import { computed, signal } from "@sigrea/core";
import { describe, expect, it } from "vitest";

import { useToString } from "./index";

describe("useToString", () => {
	it("converts resolved values to strings", () => {
		const value = signal<unknown>(123.345);
		const stringValue = useToString(value);

		expect(stringValue.value).toBe("123.345");

		value.value = "hi";
		expect(stringValue.value).toBe("hi");

		value.value = { foo: "hi" };
		expect(stringValue.value).toBe("[object Object]");

		value.value = null;
		expect(stringValue.value).toBe("null");

		value.value = undefined;
		expect(stringValue.value).toBe("undefined");
	});

	it("tracks computed values and getters", () => {
		const source = signal(3);
		const doubled = computed(() => source.value * 2);
		const stringValue = useToString(() => doubled.value);

		expect(stringValue.value).toBe("6");

		source.value = 4;
		expect(stringValue.value).toBe("8");
	});
});
