// @vitest-environment node

import {
	computed,
	disposeMolecule,
	isDeepSignal,
	molecule,
	mountMolecule,
	nextTick,
	readonly,
	signal,
	watch,
	watchEffect,
} from "@sigrea/core";
import { describe, expect, it } from "vitest";

import { reactiveComputed } from "./index";

describe("reactiveComputed", () => {
	it("returns a deep signal object from a computed object", () => {
		const count = signal(0);
		const state = reactiveComputed(() => ({ count }));

		expect(isDeepSignal(state)).toBe(true);
		expect(state.count).toBe(0);

		count.value = 1;

		expect(state.count).toBe(1);
	});

	it("tracks dynamic properties", async () => {
		const isFoo = signal(false);
		const state = reactiveComputed<{
			foo?: boolean;
			bar?: boolean;
			type: string;
		}>(() =>
			isFoo.value ? { foo: true, type: "foo" } : { bar: true, type: "bar" },
		);
		const types: string[] = [];
		let changes = 0;

		watch(state, () => {
			changes += 1;
		});

		watchEffect(() => {
			types.push(state.type);
		});

		expect(state.foo).toBeUndefined();
		expect(state.bar).toBe(true);
		expect(Object.keys(state)).toEqual(["bar", "type"]);

		isFoo.value = true;
		await nextTick();

		expect(state.foo).toBe(true);
		expect(state.bar).toBeUndefined();
		expect(Object.keys(state)).toEqual(["foo", "type"]);
		expect(types).toEqual(["bar", "foo"]);
		expect(changes).toBe(1);
	});

	it("allows previous value access", async () => {
		const source = signal(0);
		const state = reactiveComputed<{ source: number; count: number }>(
			(previous) => ({
				source: source.value,
				count: previous?.count ?? 2,
			}),
		);

		expect(state.source).toBe(0);
		expect(state.count).toBe(2);

		state.count = 5;
		source.value = 1;
		await nextTick();

		expect(state.source).toBe(1);
		expect(state.count).toBe(5);
	});

	it("forwards set, delete, has, and own keys to the current object", () => {
		const showExtra = signal(false);
		const symbolKey = Symbol("symbol");
		const state = reactiveComputed(() =>
			showExtra.value
				? { count: 1, extra: true, [symbolKey]: "ready" }
				: { count: 1, [symbolKey]: "ready" },
		);

		expect("extra" in state).toBe(false);
		expect(Reflect.ownKeys(state)).toEqual(["count", symbolKey]);

		state.count = 2;
		expect(state.count).toBe(2);

		Reflect.deleteProperty(state, "count");
		expect("count" in state).toBe(false);

		showExtra.value = true;

		expect("extra" in state).toBe(true);
		expect(Reflect.ownKeys(state)).toEqual(["count", "extra", symbolKey]);
	});

	it("writes through nested signals", () => {
		const count = signal(0);
		const state = reactiveComputed(() => ({ count }));

		state.count = 2;

		expect(count.value).toBe(2);
		expect(state.count).toBe(2);
	});

	it("replaces readonly signal properties without writing through them", () => {
		const count = signal(1);
		const readonlyCount = readonly(count);
		const doubled = computed(() => count.value * 2);
		const state = reactiveComputed(() => ({
			doubled,
			readonlyCount,
		}));

		state.readonlyCount = 3;
		state.doubled = 4;

		expect(count.value).toBe(1);
		expect(doubled.value).toBe(2);
		expect(state.readonlyCount).toBe(3);
		expect(state.doubled).toBe(4);
	});

	it("wraps object values returned from nested signals", () => {
		const nested = signal({ inner: signal(1) });
		const state = reactiveComputed(() => ({ nested }));

		expect(isDeepSignal(state.nested)).toBe(true);
		expect(state.nested.inner).toBe(1);

		Reflect.set(state.nested, "inner", 2);

		expect(nested.value.inner.value).toBe(2);
		expect(state.nested.inner).toBe(2);
	});

	it("updates during molecule setup before mount", () => {
		const UseState = molecule(() => {
			const count = signal(1);
			const state = reactiveComputed(() => ({
				doubled: count.value * 2,
			}));

			return { count, state };
		});
		const instance = UseState();

		expect(instance.state.doubled).toBe(2);

		instance.count.value = 2;
		expect(instance.state.doubled).toBe(4);

		mountMolecule(instance);
		instance.count.value = 3;
		expect(instance.state.doubled).toBe(6);

		disposeMolecule(instance);
	});

	it("can be imported and created without browser globals", async () => {
		const mod = await import("./index");
		const state = mod.reactiveComputed(() => ({ ready: true }));

		expect(globalThis.window).toBeUndefined();
		expect(state.ready).toBe(true);
	});
});
