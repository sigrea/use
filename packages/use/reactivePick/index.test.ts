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

import { reactivePick } from "./index";

interface TargetObject {
	foo: string;
	bar: string;
	baz?: string;
	qux?: boolean;
}

describe("reactivePick", () => {
	it("picks selected keys reactively", () => {
		const source = deepSignal<TargetObject>({
			foo: "foo",
			bar: "bar",
		});
		const state = reactivePick(source, "bar", ["baz"] as const);

		expect(Reflect.ownKeys(state)).toEqual(["bar", "baz"]);
		expect({ ...state }).toEqual({ bar: "bar", baz: undefined });

		source.foo = "foo2";
		expect({ ...state }).toEqual({ bar: "bar", baz: undefined });

		source.baz = "baz";
		expect({ ...state }).toEqual({ bar: "bar", baz: "baz" });
	});

	it("returns an empty object when no keys are picked", () => {
		const source = deepSignal({
			foo: "foo",
			bar: "bar",
		});
		const state = reactivePick(source);

		expect(Reflect.ownKeys(state)).toEqual([]);
		expect({ ...state }).toEqual({});
	});

	it("writes included keys back to the source", () => {
		const source = deepSignal<TargetObject>({
			foo: "foo",
			bar: "bar",
		});
		const state = reactivePick(source, "bar", "baz");

		state.bar = "bar2";
		state.baz = "baz";

		expect(source.bar).toBe("bar2");
		expect(source.baz).toBe("baz");
		expect({ ...state }).toEqual({ bar: "bar2", baz: "baz" });
	});

	it("writes nested collection values back to the source", () => {
		const source = deepSignal({
			list: [1],
			map: new Map([["count", 1]]),
			hidden: true,
		});
		const state = reactivePick(source, "list", "map");

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
		const state = reactivePick({ readonlyCount }, "readonlyCount");

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
		const state = reactivePick(readonly(source), "nested");
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
		const state = reactivePick(readonly(source), "list", "map");
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
		const state = reactivePick(
			source,
			(value, key) => key !== "bar" && value !== true && value !== 1,
		);

		expect({ ...state }).toEqual({ foo: "foo", baz: "baz" });

		source.qux = false;
		count.value = 2;

		expect({ ...state }).toEqual({
			foo: "foo",
			baz: "baz",
			qux: false,
			count: 2,
		});
	});

	it("tracks source changes from signal properties", async () => {
		const count = signal(1);
		const source = {
			count,
			hidden: "hidden",
		};
		const state = reactivePick(source, "count");
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
		const state = reactivePick(source, "nested");
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
		const state = reactivePick(source, "raw");

		expect(state.raw).toBe(raw);
	});

	it("picks numeric keys at runtime", () => {
		const source = deepSignal({
			1: "one",
			two: "two",
		});
		const state = reactivePick<
			Record<string | number, string>,
			string | number
		>(source as Record<string | number, string>, 1, "1");

		expect(Reflect.ownKeys(state)).toEqual(["1"]);
		expect({ ...state }).toEqual({ 1: "one" });
	});

	it("supports symbol keys", () => {
		const symbolKey = Symbol("visible");
		const hiddenKey = Symbol("hidden");
		const source = deepSignal({
			[symbolKey]: "ready",
			[hiddenKey]: "hidden",
			label: "label",
		});
		const state = reactivePick(source, symbolKey);

		expect(Reflect.ownKeys(state)).toEqual([symbolKey]);
		expect(state[symbolKey]).toBe("ready");
	});

	it("can be imported and created without browser globals", async () => {
		const mod = await import("./index");
		const state = mod.reactivePick({ ready: true, hidden: false }, "ready");

		expect(globalThis.window).toBeUndefined();
		expect(state.ready).toBe(true);
	});
});
