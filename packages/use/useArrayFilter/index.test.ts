// @vitest-environment node

import { computed, readonly, signal } from "@sigrea/core";
import { describe, expect, it, vi } from "vitest";

import { useArrayFilter } from "./index";

describe("useArrayFilter", () => {
	it("filters raw arrays", () => {
		const result = useArrayFilter([0, 1, 2, 3, 4, 5], (value) => {
			return value % 2 === 0;
		});

		expect(result.value).toEqual([0, 2, 4]);
		expect(useArrayFilter([0, 1, 2, 3], (value) => value % 2).value).toEqual([
			1, 3,
		]);
	});

	it("tracks signal array replacement", () => {
		const list = signal([0, 1, 2, 3, 4, 5]);
		const result = useArrayFilter(list, (value) => value % 2 === 0);

		expect(result.value).toEqual([0, 2, 4]);

		list.value = [1, 2, 3, 4, 5, 6];
		expect(result.value).toEqual([2, 4, 6]);
	});

	it("tracks computed and getter arrays", () => {
		const source = signal([0, 1, 2, 3, 4, 5]);
		const minimum = signal(0);
		const list = computed(() =>
			source.value.filter((value) => value >= minimum.value),
		);
		const result = useArrayFilter(
			() => list.value,
			(value) => value % 2 === 0,
		);

		expect(result.value).toEqual([0, 2, 4]);

		minimum.value = 2;
		source.value = [1, 2, 3, 4, 5, 6];

		expect(result.value).toEqual([2, 4, 6]);
	});

	it("tracks array items that are signals, computed values, or getters", () => {
		const first = signal(0);
		const second = signal(1);
		const third = computed(() => second.value + 1);
		const fourth = signal(4);
		const result = useArrayFilter(
			[first, second, third, () => fourth.value],
			(value) => value % 2 === 0,
		);

		expect(result.value).toEqual([0, 2, 4]);

		second.value = 3;
		expect(result.value).toEqual([0, 4, 4]);

		fourth.value = 5;
		expect(result.value).toEqual([0, 4]);
	});

	it("accepts readonly signal arrays and readonly signal items", () => {
		const first = readonly(signal(0));
		const second = readonly(signal(1));
		const list = readonly(signal([first, second]));
		const result = useArrayFilter(list, (value) => value % 2 === 0);

		expect(result.value).toEqual([0]);
	});

	it("passes the item index and resolved source array to the predicate", () => {
		const first = signal(0);
		const second = signal(2);
		const predicate = vi.fn((value: number, index: number, array: number[]) => {
			return value === index * 2 && array[index] === value;
		});
		const result = useArrayFilter([first, second], predicate);

		expect(result.value).toEqual([0, 2]);
		expect(predicate).toHaveBeenCalledWith(0, 0, [0, 2]);
		expect(predicate).toHaveBeenCalledWith(2, 1, [0, 2]);
	});

	it("tracks signals read inside the predicate", () => {
		const minimum = signal(0);
		const result = useArrayFilter([1, 2, 3], (value) => {
			return value >= minimum.value;
		});

		expect(result.value).toEqual([1, 2, 3]);

		minimum.value = 2;
		expect(result.value).toEqual([2, 3]);
	});
});
