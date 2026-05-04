// @vitest-environment node

import { computed, signal } from "@sigrea/core";
import { describe, expect, it } from "vitest";

import { createSignal } from "../createSignal";
import { reactify } from "./index";

describe("reactify", () => {
	it("returns a readonly computed value for primitive MaybeValue arguments", () => {
		const add = reactify((left: number, right: number) => left + right);
		const result = add(1, () => 2);

		expect(result.value).toBe(3);
	});

	it("updates when signal arguments change", () => {
		const base = signal(2);
		const exponent = signal(3);
		const pow = reactify(Math.pow);
		const result = pow(
			base,
			computed(() => exponent.value),
		);

		expect(result.value).toBe(8);

		base.value = 3;
		expect(result.value).toBe(27);

		exponent.value = 2;
		expect(result.value).toBe(9);
	});

	it("composes reactified functions", () => {
		const pow = reactify(Math.pow);
		const sqrt = reactify(Math.sqrt);
		const add = reactify((left: number, right: number) => left + right);
		const a = signal(3);
		const b = signal(4);
		const c = sqrt(add(pow(a, 2), pow(b, 2)));

		expect(c.value).toBe(5);

		a.value = 5;
		b.value = 12;

		expect(c.value).toBe(13);
	});

	it("passes wrapped union function arguments without treating them as getters", () => {
		const format = reactify((value: string | ((input: string) => string)) =>
			typeof value === "function" ? value("ready") : value,
		);
		const formatter = signal((input: string) => input.toUpperCase());
		const result = format(formatter);

		expect(result.value).toBe("READY");
	});

	it("uses the source signal depth instead of a reactify shallow option", () => {
		const stringify = reactify((value: { nested: { count: number } }) =>
			JSON.stringify(value),
		);
		const shallow = createSignal({ nested: { count: 0 } });
		const deep = createSignal({ nested: { count: 0 } }, true);
		const shallowResult = stringify(shallow);
		const deepResult = stringify(deep);

		expect(shallowResult.value).toBe('{"nested":{"count":0}}');
		expect(deepResult.value).toBe('{"nested":{"count":0}}');

		shallow.value.nested.count = 1;
		deep.value.nested.count = 1;

		expect(shallowResult.value).toBe('{"nested":{"count":0}}');
		expect(deepResult.value).toBe('{"nested":{"count":1}}');

		shallow.value = { nested: { count: 2 } };
		expect(shallowResult.value).toBe('{"nested":{"count":2}}');
	});

	it("passes wrapped function-valued arguments without treating them as getters", () => {
		const label = signal("ready");
		const callFactory = reactify((factory: () => string) => factory());
		const factory = signal(() => label.value);
		const result = callFactory(factory);

		expect(result.value).toBe("ready");

		label.value = "done";
		expect(result.value).toBe("done");
	});

	it("keeps the caller this value", () => {
		function format(this: { prefix: string }, value: string) {
			return `${this.prefix}:${value}`;
		}
		const reactiveFormat = reactify(format);
		const value = signal("ready");
		const result = reactiveFormat.call({ prefix: "item" }, value);

		expect(result.value).toBe("item:ready");

		value.value = "done";
		expect(result.value).toBe("item:done");
	});

	it("can be imported and created without browser globals", async () => {
		const mod = await import("./index");
		const double = mod.reactify((value: number) => value * 2);
		const value = signal(2);
		const result = double(value);

		expect(globalThis.window).toBeUndefined();
		expect(result.value).toBe(4);
	});
});
