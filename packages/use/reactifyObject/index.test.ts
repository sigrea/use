// @vitest-environment node

import { signal } from "@sigrea/core";
import { describe, expect, it } from "vitest";

import { reactifyObject } from "./index";

describe("reactifyObject", () => {
	it("reactifies object methods", () => {
		const { pow } = reactifyObject(Math, { includeOwnProperties: true });
		const base = signal(2);
		const exponent = signal(3);
		const result = pow(base, exponent);

		expect(result.value).toBe(8);

		base.value = 3;
		expect(result.value).toBe(27);
	});

	it("supports reactified chains", () => {
		const { parse, stringify } = reactifyObject(JSON);
		const source = signal('{"ready":true}');
		const result = stringify(parse(source));

		expect(result.value).toBe(source.value);

		source.value = '{"count":1}';
		expect(result.value).toBe(source.value);
	});

	it("can limit keys", () => {
		const source = {
			count: 1,
			double(value: number) {
				return value * 2;
			},
			triple(value: number) {
				return value * 3;
			},
		};
		const result = reactifyObject(source, ["double"] as const);

		expect(Object.keys(result)).toEqual(["double"]);
		expect(result.double(2).value).toBe(4);
	});

	it("can skip non-enumerable own properties", () => {
		const symbolKey = Symbol("symbol");
		const source = {
			[symbolKey](value: number) {
				return value * 3;
			},
		} as {
			[symbolKey](value: number): number;
			hidden(value: number): number;
		};
		Object.defineProperty(source, "hidden", {
			value: (value: number) => value * 2,
		});

		const excluded = reactifyObject(source, { includeOwnProperties: false });
		const included = reactifyObject(source, { includeOwnProperties: true });

		expect("hidden" in excluded).toBe(false);
		expect(excluded[symbolKey](2).value).toBe(6);
		expect(included.hidden(2).value).toBe(4);
	});

	it("includes symbol keys", () => {
		const doubleKey = Symbol("double");
		const source = {
			[doubleKey](value: number) {
				return value * 2;
			},
		};
		const result = reactifyObject(source);

		expect(result[doubleKey](3).value).toBe(6);
	});

	it("can select symbol keys", () => {
		const doubleKey = Symbol("double");
		const source = {
			count: 1,
			[doubleKey](value: number) {
				return value * 2;
			},
		};
		const result = reactifyObject(source, [doubleKey] as const);

		expect("count" in result).toBe(false);
		expect(result[doubleKey](3).value).toBe(6);
	});

	it("binds methods to the source object", () => {
		const source = {
			prefix: "item",
			format(value: string) {
				return `${this.prefix}:${value}`;
			},
		};
		const result = reactifyObject(source);
		const value = signal("ready");

		expect(result.format(value).value).toBe("item:ready");

		source.prefix = "next";
		value.value = "done";

		expect(result.format(value).value).toBe("next:done");
	});

	it("preserves non-function properties", () => {
		const source = {
			count: 1,
			format(value: string) {
				return value.toUpperCase();
			},
		};
		const result = reactifyObject(source);

		expect(result.count).toBe(1);
		expect(result.format("ready").value).toBe("READY");
	});

	it("can be imported and created without browser globals", async () => {
		const mod = await import("./index");
		const result = mod.reactifyObject({
			double(value: number) {
				return value * 2;
			},
		});

		expect(globalThis.window).toBeUndefined();
		expect(result.double(2).value).toBe(4);
	});
});
