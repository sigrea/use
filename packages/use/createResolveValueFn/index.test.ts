// @vitest-environment node

import { computed, readonly, signal } from "@sigrea/core";
import { describe, expect, it } from "vitest";

import { createResolveValueFn } from "./index";

describe("createResolveValueFn", () => {
	it("passes raw values through", () => {
		const join = createResolveValueFn((first: string, second: number) => {
			return `${first}:${second}`;
		});

		expect(join("ready", 1)).toBe("ready:1");
	});

	it("resolves signal and computed arguments", () => {
		const first = signal("ready");
		const count = signal(1);
		const second = computed(() => count.value + 1);
		const join = createResolveValueFn((value: string, total: number) => {
			return `${value}:${total}`;
		});

		expect(join(first, second)).toBe("ready:2");

		first.value = "done";
		count.value = 2;

		expect(join(first, second)).toBe("done:3");
	});

	it("resolves readonly signal arguments", () => {
		const value = readonly(signal("ready"));
		const upper = createResolveValueFn((input: string) => input.toUpperCase());

		expect(upper(value)).toBe("READY");
	});

	it("resolves getter arguments", () => {
		const count = signal(1);
		const double = createResolveValueFn((value: number) => value * 2);

		expect(double(() => count.value + 1)).toBe(4);
	});

	it("does not resolve the returned value", () => {
		const value = signal("ready");
		const identity = createResolveValueFn((input: string) => {
			expect(input).toBe("ready");
			return value;
		});

		expect(identity(value)).toBe(value);
	});

	it("preserves this when calling the wrapped function", () => {
		const context = {
			prefix: "item",
			format(value: number) {
				return `${this.prefix}:${value}`;
			},
		};
		const format = createResolveValueFn(context.format);
		const value = signal(1);

		expect(format.call(context, value)).toBe("item:1");
	});

	it("can be imported and created without browser globals", async () => {
		const mod = await import("./index");
		const value = signal("ready");
		const resolveValueFn = mod.createResolveValueFn((input: string) => input);

		expect(globalThis.window).toBeUndefined();
		expect(resolveValueFn(value)).toBe("ready");
	});
});
