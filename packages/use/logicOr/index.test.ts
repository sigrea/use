// @vitest-environment node

import { signal } from "@sigrea/core";
import { describe, expect, it } from "vitest";

import { logicOr } from "./index";

describe("logicOr", () => {
	it("returns false when given no arguments", () => {
		expect(logicOr().value).toBe(false);
	});

	it("returns true when any argument is truthy", () => {
		expect(logicOr(signal(true), signal(true)).value).toBe(true);
		expect(logicOr(signal("value"), signal(false)).value).toBe(true);
		expect(logicOr(signal(false), signal(1), signal(false)).value).toBe(true);

		expect(logicOr(signal(false), signal(false)).value).toBe(false);
		expect(logicOr(signal(""), signal(0)).value).toBe(false);
	});

	it("accepts plain values and getter functions", () => {
		expect(logicOr(true, false).value).toBe(true);
		expect(logicOr("value").value).toBe(true);
		expect(logicOr(false).value).toBe(false);
		expect(logicOr("").value).toBe(false);
		expect(
			logicOr(
				() => false,
				() => "value",
			).value,
		).toBe(true);
		expect(
			logicOr(
				() => false,
				() => 0,
			).value,
		).toBe(false);
	});

	it("updates when a source changes", () => {
		const left = signal(false);
		const right = signal(0);
		const result = logicOr(left, () => right.value);

		expect(result.value).toBe(false);

		right.value = 1;
		expect(result.value).toBe(true);

		right.value = 0;
		left.value = true;
		expect(result.value).toBe(true);

		left.value = false;
		expect(result.value).toBe(false);
	});
});
