// @vitest-environment node

import { computed, readonly, signal } from "@sigrea/core";
import { describe, expect, it } from "vitest";

import { useCycleList } from "./index";

describe("useCycleList", () => {
	it("cycles raw arrays and exposes writable state and index", () => {
		const cycle = useCycleList(["foo", "bar", "fooBar"]);

		expect(cycle.state.value).toBe("foo");
		expect(cycle.index.value).toBe(0);

		expect(cycle.next()).toBe("bar");
		expect(cycle.state.value).toBe("bar");
		expect(cycle.index.value).toBe(1);

		expect(cycle.prev()).toBe("foo");
		expect(cycle.state.value).toBe("foo");
		expect(cycle.index.value).toBe(0);

		cycle.index.value = 2;

		expect(cycle.state.value).toBe("fooBar");
		expect(cycle.index.value).toBe(2);

		cycle.state.value = "foo";

		expect(cycle.state.value).toBe("foo");
		expect(cycle.index.value).toBe(0);

		expect(cycle.go(1)).toBe("bar");
		expect(cycle.go(-1)).toBe("fooBar");
		expect(cycle.next(2)).toBe("bar");
		expect(cycle.prev(2)).toBe("fooBar");
		expect(cycle.go(3)).toBe("foo");
		expect(cycle.state.value).toBe("foo");
		expect(cycle.index.value).toBe(0);
	});

	it("tracks signal, computed, and getter lists", () => {
		const source = signal(["foo", "bar", "fooBar"]);
		const reversed = computed(() => [...source.value].reverse());
		const cycle = useCycleList(() => reversed.value);

		expect(cycle.state.value).toBe("fooBar");
		expect(cycle.index.value).toBe(0);

		expect(cycle.next()).toBe("bar");

		source.value = ["bar", "baz"];

		expect(cycle.state.value).toBe("bar");
		expect(cycle.index.value).toBe(1);

		source.value = ["baz"];

		expect(cycle.state.value).toBe("baz");
		expect(cycle.index.value).toBe(0);
	});

	it("resolves list items when moving through the list", () => {
		const first = signal("foo");
		const second = computed(() => "bar");
		const third = signal("fooBar");
		const cycle = useCycleList([first, second, () => third.value]);

		expect(cycle.state.value).toBe("foo");
		expect(cycle.next()).toBe("bar");

		first.value = "baz";

		expect(cycle.state.value).toBe("bar");
		expect(cycle.prev()).toBe("baz");

		third.value = "qux";

		expect(cycle.go(2)).toBe("qux");
	});

	it("supports initialValue, fallbackIndex, and a custom index lookup", () => {
		interface Item {
			id: number;
			name: string;
		}

		const initialValue = signal<Item>({ id: 2, name: "initial" });
		const fallbackIndex = signal(1);
		const cycle = useCycleList(
			[
				{ id: 1, name: "foo" },
				{ id: 2, name: "bar" },
			],
			{
				fallbackIndex,
				getIndexOf(value, list) {
					return list.findIndex((item) => item.id === value?.id);
				},
				initialValue,
			},
		);

		expect(cycle.state.value).toEqual({ id: 2, name: "initial" });
		expect(cycle.index.value).toBe(1);

		initialValue.value = { id: 1, name: "changed" };

		expect(cycle.state.value).toEqual({ id: 2, name: "initial" });
		expect(cycle.index.value).toBe(1);

		cycle.state.value = { id: 99, name: "missing" };

		expect(cycle.index.value).toBe(1);

		fallbackIndex.value = 0;

		expect(cycle.index.value).toBe(0);
		expect(cycle.next()).toEqual({ id: 2, name: "bar" });
	});

	it("accepts readonly signals", () => {
		const first = readonly(signal("foo"));
		const second = readonly(signal("bar"));
		const list = readonly(signal([first, second]));
		const cycle = useCycleList(list);

		expect(cycle.state.value).toBe("foo");
		expect(cycle.next()).toBe("bar");
	});

	it("returns undefined when the list is empty", () => {
		const emptyCycle = useCycleList<string>([]);

		expect(emptyCycle.state.value).toBeUndefined();
		expect(emptyCycle.index.value).toBe(0);
		expect(emptyCycle.next()).toBeUndefined();
		expect(emptyCycle.prev()).toBeUndefined();
		expect(emptyCycle.go(2)).toBeUndefined();
		expect(emptyCycle.state.value).toBeUndefined();
		expect(emptyCycle.index.value).toBe(0);

		const list = signal(["foo", "bar"]);
		const cycle = useCycleList(list);

		list.value = [];

		expect(cycle.state.value).toBeUndefined();
		expect(cycle.index.value).toBe(0);
		expect(cycle.go(2)).toBeUndefined();
		expect(cycle.state.value).toBeUndefined();
		expect(cycle.index.value).toBe(0);
	});
});
