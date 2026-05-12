// @vitest-environment node

import { computed, readonly, signal } from "@sigrea/core";
import { describe, expect, it, vi } from "vitest";

import { useArrayEvery } from "./index";

describe("useArrayEvery", () => {
	it("returns whether every raw array item matches", () => {
		const result = useArrayEvery([0, 2, 4, 6, 8], (value) => value % 2 === 0);

		expect(result.value).toBe(true);
		expect(useArrayEvery([2, 3, 4], (value) => value % 2 === 0).value).toBe(
			false,
		);
		expect(useArrayEvery([], () => false).value).toBe(true);
	});

	it("tracks signal array replacement", () => {
		const list = signal([0, 2, 4, 6, 8]);
		const result = useArrayEvery(list, (value) => value % 2 === 0);

		expect(result.value).toBe(true);

		list.value = [0, 2, 4, 6, 9];
		expect(result.value).toBe(false);
	});

	it("tracks computed and getter arrays", () => {
		const source = signal([0, 2, 4, 6, 8]);
		const minimum = signal(0);
		const list = computed(() =>
			source.value.filter((value) => value >= minimum.value),
		);
		const result = useArrayEvery(
			() => list.value,
			(value) => value % 2 === 0,
		);

		expect(result.value).toBe(true);

		source.value = [0, 2, 3, 4, 6, 8];
		minimum.value = 2;
		expect(result.value).toBe(false);
	});

	it("tracks array items that are signals, computed values, or getters", () => {
		const first = signal(0);
		const second = signal(2);
		const third = computed(() => second.value + 2);
		const fourth = signal(6);
		const result = useArrayEvery(
			[first, second, third, () => fourth.value],
			(value) => {
				return value % 2 === 0;
			},
		);

		expect(result.value).toBe(true);

		first.value = 1;
		expect(result.value).toBe(false);

		first.value = 0;
		second.value = 3;
		expect(result.value).toBe(false);

		second.value = 2;
		fourth.value = 7;
		expect(result.value).toBe(false);
	});

	it("accepts readonly signal arrays and readonly signal items", () => {
		const first = readonly(signal(0));
		const second = readonly(signal(2));
		const list = readonly(signal([first, second]));
		const result = useArrayEvery(list, (value) => value % 2 === 0);

		expect(result.value).toBe(true);
	});

	it("passes the item index and source array to the predicate", () => {
		const first = signal(2);
		const second = signal(4);
		const predicate = vi.fn((value: number, index: number, array) => {
			return value === (index + 1) * 2 && array[index] !== value;
		});
		const result = useArrayEvery([first, second], predicate);

		expect(result.value).toBe(true);
		expect(predicate).toHaveBeenCalledWith(2, 0, [first, second]);
		expect(predicate).toHaveBeenCalledWith(4, 1, [first, second]);
	});

	it("tracks signals read inside the predicate", () => {
		const minimum = signal(0);
		const result = useArrayEvery([1, 2, 3], (value) => {
			return value >= minimum.value;
		});

		expect(result.value).toBe(true);

		minimum.value = 2;
		expect(result.value).toBe(false);
	});
});
