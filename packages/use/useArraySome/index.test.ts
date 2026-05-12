// @vitest-environment node

import { computed, readonly, signal } from "@sigrea/core";
import { describe, expect, it, vi } from "vitest";

import { useArraySome } from "./index";

describe("useArraySome", () => {
	it("returns whether any raw array item matches", () => {
		const result = useArraySome([0, 2, 4, 6, 8], (value) => value > 10);

		expect(result.value).toBe(false);
		expect(useArraySome([0, 2, 11], (value) => value > 10).value).toBe(true);
		expect(useArraySome([], () => true).value).toBe(false);
	});

	it("tracks signal array replacement", () => {
		const list = signal([0, 2, 4, 6, 8]);
		const result = useArraySome(list, (value) => value > 10);

		expect(result.value).toBe(false);

		list.value = [0, 2, 11];
		expect(result.value).toBe(true);

		list.value = [0, 2, 4];
		expect(result.value).toBe(false);
	});

	it("tracks computed and getter arrays", () => {
		const source = signal([0, 2, 4, 6, 8]);
		const minimum = signal(0);
		const list = computed(() =>
			source.value.filter((value) => value >= minimum.value),
		);
		const result = useArraySome(
			() => list.value,
			(value) => value % 2 !== 0,
		);

		expect(result.value).toBe(false);

		source.value = [0, 2, 3, 4, 6, 8];
		minimum.value = 2;
		expect(result.value).toBe(true);
	});

	it("tracks array items that are signals, computed values, or getters", () => {
		const first = signal(0);
		const second = signal(2);
		const third = computed(() => second.value + 2);
		const fourth = signal(6);
		const result = useArraySome(
			[first, second, third, () => fourth.value],
			(value) => {
				return value > 10;
			},
		);

		expect(result.value).toBe(false);

		fourth.value = 12;
		expect(result.value).toBe(true);

		fourth.value = 6;
		second.value = 11;
		expect(result.value).toBe(true);

		second.value = 2;
		first.value = 13;
		expect(result.value).toBe(true);
	});

	it("accepts readonly signal arrays and readonly signal items", () => {
		const first = readonly(signal(0));
		const second = readonly(signal(12));
		const list = readonly(signal([first, second]));
		const result = useArraySome(list, (value) => value > 10);

		expect(result.value).toBe(true);
	});

	it("passes the item index and source array to the predicate", () => {
		const first = signal(2);
		const second = signal(4);
		const predicate = vi.fn((value: number, index: number, array) => {
			return value === 4 && index === 1 && array[index] !== value;
		});
		const result = useArraySome([first, second], predicate);

		expect(result.value).toBe(true);
		expect(predicate).toHaveBeenCalledWith(2, 0, [first, second]);
		expect(predicate).toHaveBeenCalledWith(4, 1, [first, second]);
	});

	it("uses native short-circuit behavior", () => {
		const predicate = vi.fn((value: number) => value > 1);
		const result = useArraySome([1, 2, 3], predicate);

		expect(result.value).toBe(true);
		expect(predicate).toHaveBeenCalledTimes(2);
		expect(predicate).toHaveBeenLastCalledWith(2, 1, [1, 2, 3]);
	});

	it("does not resolve predicate return values", () => {
		const result = useArraySome([1], () => signal(false));

		expect(result.value).toBe(true);
	});

	it("tracks signals read inside the predicate", () => {
		const minimum = signal(4);
		const result = useArraySome([1, 2, 3], (value) => {
			return value >= minimum.value;
		});

		expect(result.value).toBe(false);

		minimum.value = 3;
		expect(result.value).toBe(true);
	});
});
