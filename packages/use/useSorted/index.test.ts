// @vitest-environment node

import { computed, readonly, signal } from "@sigrea/core";
import { describe, expect, it, vi } from "vitest";

import { useSorted } from "./index";

describe("useSorted", () => {
	it("returns a sorted copy of raw array values", () => {
		const list = [10, 3, 5, 7, 2, 1, 8, 6, 9, 4];
		const sorted = useSorted(list);

		expect(sorted.value).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
		expect(list).toEqual([10, 3, 5, 7, 2, 1, 8, 6, 9, 4]);
	});

	it("tracks signal array replacement", () => {
		const list = signal([3, 1, 2]);
		const sorted = useSorted(list);

		expect(sorted.value).toEqual([1, 2, 3]);

		list.value = [6, 5, 4];
		expect(sorted.value).toEqual([4, 5, 6]);
	});

	it("tracks computed and getter arrays", () => {
		const source = signal([5, 1, 3, 2, 4]);
		const minimum = signal(2);
		const filtered = computed(() =>
			source.value.filter((value) => value >= minimum.value),
		);
		const sorted = useSorted(() => filtered.value);

		expect(sorted.value).toEqual([2, 3, 4, 5]);

		minimum.value = 4;
		expect(sorted.value).toEqual([4, 5]);
	});

	it("tracks array items that are signals, computed values, or getters", () => {
		const first = signal(3);
		const second = signal(1);
		const third = computed(() => second.value + 1);
		const fourth = signal(4);
		const sorted = useSorted([first, second, third, () => fourth.value]);

		expect(sorted.value).toEqual([1, 2, 3, 4]);

		second.value = 5;
		expect(sorted.value).toEqual([3, 4, 5, 6]);
	});

	it("accepts readonly signal arrays and readonly signal items", () => {
		const first = readonly(signal(2));
		const second = readonly(signal(1));
		const list = readonly(signal([first, second]));
		const sorted = useSorted(list);

		expect(sorted.value).toEqual([1, 2]);
	});

	it("sorts objects with a positional compare function", () => {
		const john = { age: 40, name: "John" };
		const jane = { age: 20, name: "Jane" };
		const joe = { age: 30, name: "Joe" };
		const sorted = useSorted([john, jane, joe], (first, second) => {
			return first.age - second.age;
		});

		expect(sorted.value).toEqual([jane, joe, john]);
	});

	it("sorts with options.compareFn", () => {
		const sorted = useSorted(
			[
				{ age: 40, name: "John" },
				{ age: 20, name: "Jane" },
				{ age: 30, name: "Joe" },
			],
			{
				compareFn: (first, second) => first.age - second.age,
			},
		);

		expect(sorted.value.map((user) => user.name)).toEqual([
			"Jane",
			"Joe",
			"John",
		]);
	});

	it("uses a custom sort function with a resolved copy", () => {
		const first = signal(2);
		const second = signal(1);
		const source = [first, second];
		const sortFn = vi.fn((list: number[], compareFn) => {
			expect(list).toEqual([2, 1]);
			expect(list).not.toBe(source);
			return list.sort(compareFn).reverse();
		});
		const sorted = useSorted(source, (left, right) => left - right, { sortFn });

		expect(sorted.value).toEqual([2, 1]);
		expect(source).toEqual([first, second]);
		expect(sortFn).toHaveBeenCalledTimes(1);
	});

	it("tracks signals read inside compareFn and sortFn", () => {
		const descending = signal(false);
		const reverseResult = signal(false);
		const sorted = useSorted(
			[1, 3, 2],
			(first, second) => {
				return descending.value ? second - first : first - second;
			},
			{
				sortFn: (list, compareFn) => {
					const result = list.sort(compareFn);

					return reverseResult.value ? result.reverse() : result;
				},
			},
		);

		expect(sorted.value).toEqual([1, 2, 3]);

		descending.value = true;
		expect(sorted.value).toEqual([3, 2, 1]);

		reverseResult.value = true;
		expect(sorted.value).toEqual([1, 2, 3]);
	});
});
