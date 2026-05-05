// @vitest-environment node

import { computed, readonly, signal } from "@sigrea/core";
import { describe, expect, it, vi } from "vitest";

import { useArrayFindLast } from "./index";

describe("useArrayFindLast", () => {
	it("finds values from raw arrays", () => {
		const result = useArrayFindLast([-1, 2, 3], (value) => value > 0);

		expect(result.value).toBe(3);
		expect(
			useArrayFindLast([-1, -2], (value) => value > 0).value,
		).toBeUndefined();
		expect(useArrayFindLast([], () => true).value).toBeUndefined();
	});

	it("tracks signal array replacement", () => {
		const list = signal([-1, 2, 3]);
		const result = useArrayFindLast(list, (value) => value > 0);

		expect(result.value).toBe(3);

		list.value = [-1, 2, -3];
		expect(result.value).toBe(2);

		list.value = [-1, -2, -3];
		expect(result.value).toBeUndefined();
	});

	it("tracks computed and getter arrays", () => {
		const source = signal([-1, -2, 3]);
		const minimum = signal(-10);
		const list = computed(() =>
			source.value.filter((value) => value >= minimum.value),
		);
		const result = useArrayFindLast(
			() => list.value,
			(value) => value > 0,
		);

		expect(result.value).toBe(3);

		minimum.value = 0;
		source.value = [-1, 2, -3];

		expect(result.value).toBe(2);
	});

	it("tracks array items that are signals, computed values, or getters", () => {
		const first = signal(1);
		const second = signal(2);
		const third = computed(() => second.value + 1);
		const fourth = signal(-4);
		const result = useArrayFindLast(
			[first, second, third, () => fourth.value],
			(value) => value > 0,
		);

		expect(result.value).toBe(3);

		second.value = -2;
		expect(result.value).toBe(1);

		fourth.value = 4;
		expect(result.value).toBe(4);
	});

	it("accepts readonly signal arrays and readonly signal items", () => {
		const first = readonly(signal(1));
		const second = readonly(signal(2));
		const list = readonly(signal([first, second]));
		const result = useArrayFindLast(list, (value) => value > 0);

		expect(result.value).toBe(2);
	});

	it("passes the item index and source array to the predicate from the end", () => {
		const first = signal(-1);
		const second = signal(2);
		const predicate = vi.fn((value: number, index: number, array) => {
			return value === index && array[index] !== value;
		});
		const result = useArrayFindLast([first, second], predicate);

		expect(result.value).toBeUndefined();
		expect(predicate).toHaveBeenNthCalledWith(1, 2, 1, [first, second]);
		expect(predicate).toHaveBeenNthCalledWith(2, -1, 0, [first, second]);
	});

	it("stops at the last matching item", () => {
		const predicate = vi.fn((value: number) => value > 1);
		const result = useArrayFindLast([1, 2, 3], predicate);

		expect(result.value).toBe(3);
		expect(predicate).toHaveBeenCalledTimes(1);
		expect(predicate).toHaveBeenCalledWith(3, 2, [1, 2, 3]);
	});

	it("tracks signals read inside the predicate", () => {
		const minimum = signal(0);
		const result = useArrayFindLast([1, 2, 3], (value) => {
			return value >= minimum.value;
		});

		expect(result.value).toBe(3);

		minimum.value = 4;
		expect(result.value).toBeUndefined();
	});
});
