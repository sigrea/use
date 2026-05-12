// @vitest-environment node

import { signal } from "@sigrea/core";
import { describe, expect, it } from "vitest";

import { logicNot } from "./index";

describe("logicNot", () => {
	it("returns the logical complement of signals", () => {
		expect(logicNot(signal(true)).value).toBe(false);
		expect(logicNot(signal("value")).value).toBe(false);
		expect(logicNot(signal(1)).value).toBe(false);

		expect(logicNot(signal(false)).value).toBe(true);
		expect(logicNot(signal("")).value).toBe(true);
		expect(logicNot(signal(0)).value).toBe(true);
	});

	it("returns the logical complement of plain values and getters", () => {
		expect(logicNot(true).value).toBe(false);
		expect(logicNot("value").value).toBe(false);
		expect(logicNot(false).value).toBe(true);
		expect(logicNot("").value).toBe(true);
		expect(logicNot(() => true).value).toBe(false);
		expect(logicNot(() => 0).value).toBe(true);
	});

	it("updates when the source changes", () => {
		const source = signal(false);
		const result = logicNot(source);

		expect(result.value).toBe(true);

		source.value = true;
		expect(result.value).toBe(false);
	});
});
