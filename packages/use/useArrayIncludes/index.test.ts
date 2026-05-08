// @vitest-environment node

import { computed, readonly, signal } from "@sigrea/core";
import { describe, expect, it, vi } from "vitest";

import { useArrayIncludes } from "./index";

describe("useArrayIncludes", () => {
	it("checks raw arrays with Array.includes equality", () => {
		expect(useArrayIncludes([1, 2, 3], 2).value).toBe(true);
		expect(useArrayIncludes([1, 2, 3], 4).value).toBe(false);
		expect(useArrayIncludes([], 1).value).toBe(false);
		expect(useArrayIncludes([Number.NaN], Number.NaN).value).toBe(true);
		expect(useArrayIncludes([0], -0).value).toBe(true);
		expect(
			useArrayIncludes(Array<number | undefined>(1), undefined).value,
		).toBe(true);
	});

	it("tracks signal array replacement", () => {
		const list = signal([1, 2, 3]);
		const result = useArrayIncludes(list, 4);

		expect(result.value).toBe(false);

		list.value = [1, 4];
		expect(result.value).toBe(true);

		list.value = [1, 2];
		expect(result.value).toBe(false);
	});

	it("tracks computed and getter arrays", () => {
		const source = signal([1, 2, 3]);
		const minimum = signal(0);
		const list = computed(() =>
			source.value.filter((value) => value >= minimum.value),
		);
		const result = useArrayIncludes(() => list.value, 2);

		expect(result.value).toBe(true);

		minimum.value = 3;
		expect(result.value).toBe(false);

		source.value = [2, 3];
		minimum.value = 2;
		expect(result.value).toBe(true);
	});

	it("tracks reactive search values", () => {
		const value = signal(4);
		const computedValue = computed(() => value.value - 1);
		const result = useArrayIncludes([1, 2, 3], () => computedValue.value);

		expect(result.value).toBe(true);

		value.value = 5;
		expect(result.value).toBe(false);
	});

	it("tracks array items that are signals, computed values, or getters", () => {
		const first = signal(1);
		const second = signal(2);
		const third = computed(() => second.value + 1);
		const fourth = signal(4);
		const result = useArrayIncludes(
			[first, second, third, () => fourth.value],
			3,
		);

		expect(result.value).toBe(true);

		second.value = -2;
		expect(result.value).toBe(false);

		fourth.value = 3;
		expect(result.value).toBe(true);
	});

	it("accepts readonly signal arrays and readonly signal items", () => {
		const first = readonly(signal(1));
		const second = readonly(signal(2));
		const list = readonly(signal([first, second]));
		const result = useArrayIncludes(list, 2);

		expect(result.value).toBe(true);
	});

	it("compares with a key", () => {
		const list = signal([{ id: 1 }, { id: 2 }, { id: 3 }]);
		const result = useArrayIncludes(list, 3, "id");

		expect(result.value).toBe(true);

		list.value = [{ id: 1 }, { id: 2 }];
		expect(result.value).toBe(false);
	});

	it("compares with a function", () => {
		const list = signal([{ id: 1 }, { id: 2 }, { id: 3 }]);
		const value = signal({ id: 3 });
		const result = useArrayIncludes(
			list,
			value,
			(element, searchValue) => element.id === searchValue.id,
		);

		expect(result.value).toBe(true);

		value.value = { id: 4 };
		expect(result.value).toBe(false);

		list.value = [{ id: 4 }];
		expect(result.value).toBe(true);
	});

	it("supports fromIndex and passes the sliced source array", () => {
		const list = [signal(1), signal(2), signal(3)];
		const predicate = vi.fn((element: number, value: number) => {
			return element === value;
		});
		const result = useArrayIncludes(list, 2, {
			fromIndex: 1,
			comparator: predicate,
		});

		expect(result.value).toBe(true);
		expect(predicate).toHaveBeenCalledTimes(1);
		expect(predicate).toHaveBeenCalledWith(2, 2, 0, [list[1], list[2]]);
		expect(useArrayIncludes(list, 2, { fromIndex: 1 }).value).toBe(true);
		expect(useArrayIncludes(list, 1, { fromIndex: 1 }).value).toBe(false);
	});

	it("supports a reactive fromIndex option", () => {
		const fromIndex = signal(0);
		const result = useArrayIncludes([1, 2, 3], 1, { fromIndex });

		expect(result.value).toBe(true);

		fromIndex.value = 1;
		expect(result.value).toBe(false);
	});

	it("supports options with a key comparator", () => {
		const result = useArrayIncludes([{ id: 1 }, { id: 2 }], 1, {
			fromIndex: 1,
			comparator: "id",
		});

		expect(result.value).toBe(false);
	});

	it("stops after the first matching item", () => {
		const comparator = vi.fn((element: number, value: number) => {
			return element === value;
		});
		const result = useArrayIncludes([1, 2, 2, 3], 2, comparator);

		expect(result.value).toBe(true);
		expect(comparator).toHaveBeenCalledTimes(2);
		expect(comparator).toHaveBeenNthCalledWith(1, 1, 2, 0, [1, 2, 2, 3]);
		expect(comparator).toHaveBeenNthCalledWith(2, 2, 2, 1, [1, 2, 2, 3]);
	});

	it("tracks signals read inside the comparator", () => {
		const enabled = signal(true);
		const result = useArrayIncludes([1, 2, 3], 2, (element, value) => {
			return enabled.value && element === value;
		});

		expect(result.value).toBe(true);

		enabled.value = false;
		expect(result.value).toBe(false);
	});
});
