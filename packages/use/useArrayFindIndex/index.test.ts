// @vitest-environment node

import { computed, readonly, signal } from "@sigrea/core";
import { describe, expect, it, vi } from "vitest";

import { useArrayFindIndex } from "./index";

describe("useArrayFindIndex", () => {
	it("finds indexes from raw arrays", () => {
		const result = useArrayFindIndex([-1, -2, 3], (value) => value > 0);

		expect(result.value).toBe(2);
		expect(useArrayFindIndex([-1, -2], (value) => value > 0).value).toBe(-1);
		expect(useArrayFindIndex([], () => true).value).toBe(-1);
	});

	it("tracks signal array replacement", () => {
		const list = signal([-1, -2, 3]);
		const result = useArrayFindIndex(list, (value) => value > 0);

		expect(result.value).toBe(2);

		list.value = [-1, 2, 3];
		expect(result.value).toBe(1);

		list.value = [-1, -2, -3];
		expect(result.value).toBe(-1);
	});

	it("tracks computed and getter arrays", () => {
		const source = signal([-1, -2, 3]);
		const minimum = signal(-10);
		const list = computed(() =>
			source.value.filter((value) => value >= minimum.value),
		);
		const result = useArrayFindIndex(
			() => list.value,
			(value) => value > 0,
		);

		expect(result.value).toBe(2);

		minimum.value = 0;
		source.value = [-1, 2, 3];

		expect(result.value).toBe(0);
	});

	it("tracks array items that are signals, computed values, or getters", () => {
		const first = signal(-1);
		const second = signal(-2);
		const third = computed(() => second.value + 4);
		const fourth = signal(-4);
		const result = useArrayFindIndex(
			[first, second, third, () => fourth.value],
			(value) => value > 0,
		);

		expect(result.value).toBe(2);

		second.value = -5;
		expect(result.value).toBe(-1);

		fourth.value = 4;
		expect(result.value).toBe(3);
	});

	it("accepts readonly signal arrays and readonly signal items", () => {
		const first = readonly(signal(-1));
		const second = readonly(signal(2));
		const list = readonly(signal([first, second]));
		const result = useArrayFindIndex(list, (value) => value > 0);

		expect(result.value).toBe(1);
	});

	it("passes the item index and source array to the predicate", () => {
		const first = signal(-1);
		const second = signal(2);
		const predicate = vi.fn((value: number, index: number, array) => {
			return value === index && array[index] !== value;
		});
		const result = useArrayFindIndex([first, second], predicate);

		expect(result.value).toBe(-1);
		expect(predicate).toHaveBeenCalledWith(-1, 0, [first, second]);
		expect(predicate).toHaveBeenCalledWith(2, 1, [first, second]);
	});

	it("stops at the first matching item", () => {
		const predicate = vi.fn((value: number) => value > 1);
		const result = useArrayFindIndex([1, 2, 3], predicate);

		expect(result.value).toBe(1);
		expect(predicate).toHaveBeenCalledTimes(2);
		expect(predicate).toHaveBeenNthCalledWith(1, 1, 0, [1, 2, 3]);
		expect(predicate).toHaveBeenNthCalledWith(2, 2, 1, [1, 2, 3]);
	});

	it("tracks signals read inside the predicate", () => {
		const minimum = signal(0);
		const result = useArrayFindIndex([1, 2, 3], (value) => {
			return value >= minimum.value;
		});

		expect(result.value).toBe(0);

		minimum.value = 2;
		expect(result.value).toBe(1);
	});
});
