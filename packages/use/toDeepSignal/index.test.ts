// @vitest-environment node

import {
	computed,
	disposeMolecule,
	isDeepSignal,
	markRaw,
	molecule,
	mountMolecule,
	nextTick,
	readonly,
	signal,
	watch,
	watchEffect,
} from "@sigrea/core";
import { describe, expect, it } from "vitest";

import { toDeepSignal } from "./index";

describe("toDeepSignal", () => {
	it("returns a deep signal for raw objects", async () => {
		const source = { nested: { count: 1 } };
		const state = toDeepSignal(source);
		const values: number[] = [];

		expect(isDeepSignal(state)).toBe(true);
		expect(state.nested.count).toBe(1);

		watchEffect(() => {
			values.push(state.nested.count);
		});

		state.nested.count = 2;
		await nextTick();

		expect(source.nested.count).toBe(2);
		expect(values).toEqual([1, 2]);
	});

	it("forwards object signal reads and writes to the current value", async () => {
		const source = signal<{ a?: string; b?: number; c?: string }>({
			a: "a",
			b: 0,
		});
		const state = toDeepSignal(source);
		const values: Array<number | undefined> = [];
		let changes = 0;

		watchEffect(() => {
			values.push(state.b);
		});
		watch(state, () => {
			changes += 1;
		});

		state.b = 1;
		await nextTick();

		expect(source.value.b).toBe(1);
		expect(values).toEqual([0, 1]);
		expect(changes).toBe(1);

		source.value = { c: "c" };
		await nextTick();

		expect(state.a).toBeUndefined();
		expect(state.b).toBeUndefined();
		expect(state.c).toBe("c");
		expect(Object.keys(state)).toEqual(["c"]);
		expect(values).toEqual([0, 1, undefined]);
		expect(changes).toBe(2);
	});

	it("forwards delete, has, own keys, descriptors, and definitions", () => {
		const symbolKey = Symbol("visible");
		const extra = signal("extra");
		const source = signal<Record<PropertyKey, unknown>>({
			count: 1,
			hidden: true,
			[symbolKey]: "symbol",
		});
		const state = toDeepSignal(source);

		Object.defineProperty(source.value, "fixed", {
			value: "fixed",
			writable: false,
			enumerable: false,
			configurable: false,
		});
		Object.defineProperty(source.value, "computedLabel", {
			get() {
				return this.count;
			},
			set(value) {
				this.count = value;
			},
			enumerable: true,
			configurable: true,
		});

		expect("hidden" in state).toBe(true);
		expect(Reflect.ownKeys(state)).toEqual([
			"count",
			"hidden",
			"fixed",
			"computedLabel",
			symbolKey,
		]);
		expect(JSON.stringify(state)).toBe(
			JSON.stringify({ count: 1, hidden: true, computedLabel: 1 }),
		);
		expect(Object.getOwnPropertyDescriptor(state, "fixed")).toEqual({
			value: "fixed",
			writable: false,
			enumerable: false,
			configurable: true,
		});
		expect(Object.getOwnPropertyDescriptor(state, "computedLabel")).toEqual({
			get: Object.getOwnPropertyDescriptor(source.value, "computedLabel")?.get,
			set: Object.getOwnPropertyDescriptor(source.value, "computedLabel")?.set,
			enumerable: true,
			configurable: true,
		});

		Object.defineProperty(state, "label", {
			value: "ready",
			enumerable: true,
			configurable: true,
		});
		Object.defineProperty(state, "extra", {
			value: extra,
			enumerable: true,
			configurable: true,
		});
		Reflect.deleteProperty(state, "hidden");

		expect("hidden" in state).toBe(false);
		expect(source.value.label).toBe("ready");
		expect(source.value.hidden).toBeUndefined();
		expect(state.extra).toBe("extra");

		state.extra = "next";

		expect(extra.value).toBe("next");
		expect(Reflect.ownKeys(state)).toEqual([
			"count",
			"fixed",
			"computedLabel",
			"label",
			"extra",
			symbolKey,
		]);
	});

	it("rejects non-configurable definitions without mutating the source", () => {
		const source = signal<Record<PropertyKey, unknown>>({
			count: 1,
		});
		const state = toDeepSignal(source);

		expect(() => {
			Object.defineProperty(state, "locked", {
				value: true,
				enumerable: true,
				configurable: false,
			});
		}).toThrow(TypeError);
		expect(() => {
			Object.defineProperty(state, "implicitLocked", {
				value: true,
			});
		}).toThrow(TypeError);
		expect(source.value.locked).toBeUndefined();
		expect(source.value.implicitLocked).toBeUndefined();
		expect(Object.isExtensible(state)).toBe(true);
		expect(() => Object.preventExtensions(state)).toThrow(TypeError);
		expect(Object.isExtensible(state)).toBe(true);
	});

	it("rejects non-plain object sources", () => {
		expect(() => toDeepSignal([1] as unknown as object)).toThrow(TypeError);
		expect(() =>
			toDeepSignal(signal(new Map([["count", 1]])) as never),
		).toThrow(TypeError);
		expect(() => toDeepSignal(new ArrayBuffer(8) as unknown as object)).toThrow(
			TypeError,
		);
		expect(() => toDeepSignal(new (class Box {})())).toThrow(TypeError);
	});

	it("rejects raw root sources", () => {
		const raw = markRaw({ count: 1 });

		expect(() => toDeepSignal(raw)).toThrow(TypeError);
		expect(() => toDeepSignal(signal(raw))).toThrow(TypeError);
	});

	it("unwraps signal properties and writes back to writable signals", async () => {
		const count = signal(1);
		const nested = signal({ inner: signal(2) });
		const source = signal({
			count,
			nested,
		});
		const state = toDeepSignal(source);
		const values: number[] = [];

		watchEffect(() => {
			values.push(state.nested.inner);
		});

		expect(state.count).toBe(1);
		expect(state.nested.inner).toBe(2);

		state.count = 3;
		state.nested.inner = 4;
		await nextTick();

		expect(count.value).toBe(3);
		expect(nested.value.inner.value).toBe(4);
		expect(values).toEqual([2, 4]);
	});

	it("does not replace writable signal properties with signal assignments", () => {
		const count = signal(1);
		const source = {
			count,
		};
		const state = toDeepSignal(source);

		(state as { count: unknown }).count = signal(2);

		expect(source.count).toBe(count);
		expect(count.value).toBe(2);
		expect(state.count).toBe(2);
	});

	it("does not replace forwarded writable signal properties with signal assignments", () => {
		const count = signal(1);
		const source = signal({
			count,
		});
		const state = toDeepSignal(source);

		(state as { count: unknown }).count = signal(2);

		expect(source.value.count).toBe(count);
		expect(count.value).toBe(2);
		expect(state.count).toBe(2);
	});

	it("keeps readonly signal-valued properties readonly at runtime", () => {
		const count = signal(1);
		const state = toDeepSignal({
			count: readonly(count),
		});

		expect(state.count).toBe(1);
		expect(() => {
			(state as { count: number }).count = 2;
		}).toThrow(TypeError);
		expect(count.value).toBe(1);
	});

	it("does not replace readonly signal properties with signal assignments", () => {
		const count = signal(1);
		const state = toDeepSignal({
			count: readonly(count),
		});

		expect(() => {
			(state as { count: unknown }).count = signal(2);
		}).toThrow(TypeError);
		expect(count.value).toBe(1);
		expect(state.count).toBe(1);
	});

	it("does not replace forwarded readonly signal properties with signal assignments", () => {
		const count = signal(1);
		const source = signal({
			count: readonly(count),
		});
		const state = toDeepSignal(source);
		const original = source.value.count;

		expect(() => {
			(state as { count: unknown }).count = signal(2);
		}).toThrow(TypeError);
		expect(count.value).toBe(1);
		expect(state.count).toBe(1);
		expect(source.value.count).toBe(original);
	});

	it("keeps forwarded readonly signal properties readonly at runtime", () => {
		const count = signal(1);
		const source = signal({
			count: readonly(count),
		});
		const state = toDeepSignal(source);
		const original = source.value.count;

		expect(() => {
			(state as { count: number }).count = 2;
		}).toThrow(TypeError);
		expect(count.value).toBe(1);
		expect(state.count).toBe(1);
		expect(source.value.count).toBe(original);
	});

	it("reads from readonly object signal containers", () => {
		const source = signal({ count: 1 });
		const state = toDeepSignal(readonly(source));

		expect(state.count).toBe(1);

		source.value = { count: 2 };

		expect(state.count).toBe(2);

		state.count = 3;

		expect(source.value.count).toBe(3);
	});

	it("reads computed object sources and tracks replacements", async () => {
		const count = signal(0);
		const source = computed(() => ({
			count: count.value,
			label: count.value > 0 ? "ready" : "idle",
		}));
		const state = toDeepSignal(source);
		const labels: string[] = [];

		watchEffect(() => {
			labels.push(state.label);
		});

		count.value = 1;
		await nextTick();

		expect(state.count).toBe(1);
		expect(state.label).toBe("ready");
		expect(labels).toEqual(["idle", "ready"]);
	});

	it("updates during molecule setup before mount", () => {
		const UseState = molecule(() => {
			const source = signal({ count: 1 });
			const state = toDeepSignal(source);

			return { source, state };
		});
		const instance = UseState();

		expect(instance.state.count).toBe(1);

		instance.source.value = { count: 2 };
		expect(instance.state.count).toBe(2);

		mountMolecule(instance);
		instance.source.value = { count: 3 };
		expect(instance.state.count).toBe(3);

		disposeMolecule(instance);
	});

	it("throws when a signal source does not currently hold an object", () => {
		const source = signal({ count: 1 });
		const state = toDeepSignal(source);

		source.value = undefined as unknown as { count: number };

		expect(() => state.count).toThrow(TypeError);
	});

	it("can be imported and created without browser globals", async () => {
		const mod = await import("./index");
		const state = mod.toDeepSignal({ ready: true });

		expect(globalThis.window).toBeUndefined();
		expect(state.ready).toBe(true);
	});
});
