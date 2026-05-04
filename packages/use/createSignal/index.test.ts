// @vitest-environment node

import { isDeepSignal, nextTick, watchEffect } from "@sigrea/core";
import { describe, expect, it } from "vitest";

import { createSignal } from "./index";

describe("createSignal", () => {
	it("creates a shallow signal by default", () => {
		const value = createSignal({ nested: { count: 0 } });

		expect(value.value.nested.count).toBe(0);
		expect(isDeepSignal(value.value)).toBe(false);
	});

	it("creates a shallow signal when deep is false", () => {
		const value = createSignal({ nested: { count: 0 } }, false);

		expect(value.value.nested.count).toBe(0);
		expect(isDeepSignal(value.value)).toBe(false);
	});

	it("creates a deep value holder when deep is true", () => {
		const value = createSignal({ nested: { count: 0 } }, true);

		expect(value.value.nested.count).toBe(0);
		expect(isDeepSignal(value.value)).toBe(true);
		expect(typeof value.peek).toBe("function");
	});

	it("tracks assignments for shallow values", async () => {
		const value = createSignal({ nested: { count: 0 } });
		const calls: number[] = [];

		watchEffect(() => {
			calls.push(value.value.nested.count);
		});

		value.value = { nested: { count: 1 } };
		await nextTick();

		expect(calls).toEqual([0, 1]);
	});

	it("does not track nested writes for shallow values", async () => {
		const value = createSignal({ nested: { count: 0 } });
		const calls: number[] = [];

		watchEffect(() => {
			calls.push(value.value.nested.count);
		});

		value.value.nested.count = 1;
		await nextTick();

		expect(calls).toEqual([0]);
	});

	it("tracks assignments for deep values", async () => {
		const value = createSignal({ nested: { count: 0 } }, true);
		const calls: number[] = [];

		watchEffect(() => {
			calls.push(value.value.nested.count);
		});

		value.value = { nested: { count: 1 } };
		await nextTick();

		expect(calls).toEqual([0, 1]);
		expect(isDeepSignal(value.value)).toBe(true);
	});

	it("tracks nested writes for deep values", async () => {
		const value = createSignal({ nested: { count: 0 } }, true);
		const calls: number[] = [];

		watchEffect(() => {
			calls.push(value.value.nested.count);
		});

		value.value.nested.count = 1;
		await nextTick();

		expect(calls).toEqual([0, 1]);
	});

	it("tracks nested writes after replacing deep values", async () => {
		const value = createSignal({ nested: { count: 0 } }, true);
		const calls: number[] = [];

		watchEffect(() => {
			calls.push(value.value.nested.count);
		});

		value.value = { nested: { count: 1 } };
		await nextTick();
		value.value.nested.count = 2;
		await nextTick();

		expect(calls).toEqual([0, 1, 2]);
		expect(isDeepSignal(value.value)).toBe(true);
	});

	it("supports primitive values", () => {
		const shallow = createSignal(0);
		const deep = createSignal(0, true);

		shallow.value = 1;
		deep.value = 2;

		expect(shallow.value).toBe(1);
		expect(deep.value).toBe(2);
	});

	it("can be imported and created without browser globals", async () => {
		const mod = await import("./index");
		const value = mod.createSignal("ready");

		expect(globalThis.window).toBeUndefined();
		expect(value.value).toBe("ready");
	});
});
