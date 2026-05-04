// @vitest-environment node

import {
	deepSignal,
	markRaw,
	nextTick,
	readonly,
	signal,
	watchEffect,
} from "@sigrea/core";
import { describe, expect, it, vi } from "vitest";

import { reactiveOmit } from "./index";

interface TargetObject {
	foo: string;
	bar: string;
	baz?: string;
	qux?: boolean;
}

describe("reactiveOmit", () => {
	it("omits selected keys reactively", () => {
		const source = deepSignal<TargetObject>({
			foo: "foo",
			bar: "bar",
		});
		const state = reactiveOmit(source, "bar", ["baz"] as const);

		expect({ ...state }).toEqual({ foo: "foo" });

		source.qux = true;
		expect({ ...state }).toEqual({ foo: "foo", qux: true });

		source.baz = "hidden";
		expect({ ...state }).toEqual({ foo: "foo", qux: true });
	});

	it("returns all keys when no keys are omitted", () => {
		const source = deepSignal({
			foo: "foo",
			bar: "bar",
		});
		const state = reactiveOmit(source);

		expect({ ...state }).toEqual({ foo: "foo", bar: "bar" });
	});

	it("writes included keys back to the source", () => {
		const source = deepSignal({
			foo: "foo",
			bar: "bar",
		});
		const state = reactiveOmit(source, "bar");

		state.foo = "foo2";

		expect(source.foo).toBe("foo2");
		expect({ ...state }).toEqual({ foo: "foo2" });
	});

	it("writes nested collection values back to the source", () => {
		const source = deepSignal({
			list: [1],
			map: new Map([["count", 1]]),
			hidden: true,
		});
		const state = reactiveOmit(source, "hidden");

		state.list.push(2);
		state.map.set("count", 2);

		expect(Array.isArray(state.list)).toBe(true);
		expect(state.map).toBeInstanceOf(Map);
		expect(source.list).toEqual([1, 2]);
		expect(state.list.length).toBe(2);
		expect(source.map.get("count")).toBe(2);
		expect(state.map.get("count")).toBe(2);
	});

	it("does not write through readonly signal sources", () => {
		const readonlyCount = readonly(signal(1));
		const state = reactiveOmit({ readonlyCount });

		expect(state.readonlyCount).toBe(1);
		expect(() => {
			(state as { readonlyCount: number }).readonlyCount = 2;
		}).toThrow(TypeError);
	});

	it("does not write nested values through readonly deep signal sources", () => {
		const source = deepSignal({
			nested: { count: 1 },
			hidden: true,
		});
		const state = reactiveOmit(readonly(source), "hidden");
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

		try {
			(state as { nested: { count: number } }).nested.count = 2;
		} finally {
			warn.mockRestore();
		}

		expect(source.nested.count).toBe(1);
		expect(state.nested.count).toBe(1);
	});

	it("does not write nested collections through readonly deep signal sources", () => {
		const source = deepSignal({
			list: [1],
			map: new Map([["count", 1]]),
			hidden: true,
		});
		const state = reactiveOmit(readonly(source), "hidden");
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

		try {
			(state as { list: number[]; map: Map<string, number> }).list.push(2);
			(state as { list: number[]; map: Map<string, number> }).map.set(
				"count",
				2,
			);
		} finally {
			warn.mockRestore();
		}

		expect(source.list).toEqual([1]);
		expect(Array.isArray(state.list)).toBe(true);
		expect(state.list.length).toBe(1);
		expect(state.map).toBeInstanceOf(Map);
		expect(source.map.get("count")).toBe(1);
		expect(
			(state as unknown as { map: Map<string, number> }).map.get("count"),
		).toBe(1);
	});

	it("supports predicates", () => {
		const count = signal(1);
		const source = deepSignal<TargetObject & { count: typeof count }>({
			foo: "foo",
			bar: "bar",
			baz: "baz",
			qux: true,
			count,
		});
		const state = reactiveOmit(
			source,
			(value, key) =>
				key === "bar" || key === "baz" || value === true || value === 1,
		);

		expect({ ...state }).toEqual({ foo: "foo" });

		source.qux = false;
		count.value = 2;

		expect({ ...state }).toEqual({ foo: "foo", qux: false, count: 2 });
	});

	it("tracks source changes from signal properties", async () => {
		const count = signal(1);
		const source = {
			count,
			hidden: "hidden",
		};
		const state = reactiveOmit(source, "hidden");
		const values: number[] = [];

		watchEffect(() => {
			values.push(state.count);
		});

		count.value = 2;
		await nextTick();

		expect(values).toEqual([1, 2]);

		state.count = 3;

		expect(count.value).toBe(3);
		expect(state.count).toBe(3);
	});

	it("tracks nested writes from signal object properties", async () => {
		const nested = signal({ count: 1 });
		const source = {
			nested,
			hidden: true,
		};
		const state = reactiveOmit(source, "hidden");
		const values: number[] = [];

		watchEffect(() => {
			values.push(state.nested.count);
		});

		state.nested.count = 2;
		await nextTick();

		expect(values).toEqual([1, 2]);
		expect(nested.value.count).toBe(2);
		expect(state.nested.count).toBe(2);
	});

	it("preserves raw object identity", () => {
		const raw = markRaw({ count: 1 });
		const source = deepSignal({
			raw,
			hidden: true,
		});
		const state = reactiveOmit(source, "hidden");

		expect(state.raw).toBe(raw);
	});

	it("omits numeric keys at runtime", () => {
		const source = deepSignal({
			1: "one",
			two: "two",
		});
		const state = reactiveOmit(source, 1);

		expect(Reflect.ownKeys(state)).toEqual(["two"]);
		expect({ ...state }).toEqual({ two: "two" });
	});

	it("supports symbol keys", () => {
		const symbolKey = Symbol("visible");
		const omittedKey = Symbol("omitted");
		const source = deepSignal({
			[symbolKey]: "ready",
			[omittedKey]: "hidden",
			label: "label",
		});
		const state = reactiveOmit(source, omittedKey);

		expect(Reflect.ownKeys(state)).toEqual(["label", symbolKey]);
		expect(state[symbolKey]).toBe("ready");
	});

	it("can be imported and created without browser globals", async () => {
		const mod = await import("./index");
		const state = mod.reactiveOmit({ ready: true, hidden: false }, "hidden");

		expect(globalThis.window).toBeUndefined();
		expect(state.ready).toBe(true);
	});
});
