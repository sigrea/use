// @vitest-environment node

import { signal } from "@sigrea/core";
import { describe, expect, it } from "vitest";

import { logicAnd } from "./index";

describe("logicAnd", () => {
	it("returns true when given no arguments", () => {
		expect(logicAnd().value).toBe(true);
	});

	it("returns true only when all arguments are truthy", () => {
		expect(logicAnd(signal(true), signal(true)).value).toBe(true);
		expect(logicAnd(signal("value"), signal(1)).value).toBe(true);

		expect(logicAnd(signal(true), signal(false)).value).toBe(false);
		expect(logicAnd(signal("value"), signal(0)).value).toBe(false);
	});

	it("accepts plain values and getter functions", () => {
		expect(logicAnd(true, "value").value).toBe(true);
		expect(logicAnd(true, false).value).toBe(false);
		expect(
			logicAnd(
				() => true,
				() => "value",
			).value,
		).toBe(true);
		expect(
			logicAnd(
				() => true,
				() => 0,
			).value,
		).toBe(false);
	});

	it("updates when a source changes", () => {
		const left = signal(true);
		const right = signal(1);
		const result = logicAnd(left, () => right.value);

		expect(result.value).toBe(true);

		right.value = 0;
		expect(result.value).toBe(false);

		right.value = 2;
		left.value = false;
		expect(result.value).toBe(false);

		left.value = true;
		expect(result.value).toBe(true);
	});
});
