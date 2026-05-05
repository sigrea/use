// @vitest-environment node

import { computed, readonly, signal } from "@sigrea/core";
import { describe, expect, it, vi } from "vitest";

import { useArrayMap } from "./index";

describe("useArrayMap", () => {
	it("maps raw arrays", () => {
		const result = useArrayMap([0, 1, 2, 3, 4], (value) => value * 2);

		expect(result.value).toEqual([0, 2, 4, 6, 8]);
		expect(useArrayMap([], (value) => value).value).toEqual([]);
	});

	it("tracks signal array replacement", () => {
		const list = signal([0, 1, 2, 3, 4]);
		const result = useArrayMap(list, (value) => value * 2);

		expect(result.value).toEqual([0, 2, 4, 6, 8]);

		list.value = [0, 1, 2, 3];
		expect(result.value).toEqual([0, 2, 4, 6]);
	});

	it("tracks computed and getter arrays", () => {
		const source = signal([0, 1, 2, 3, 4]);
		const minimum = signal(0);
		const list = computed(() =>
			source.value.filter((value) => value >= minimum.value),
		);
		const result = useArrayMap(
			() => list.value,
			(value) => value * 2,
		);

		expect(result.value).toEqual([0, 2, 4, 6, 8]);

		minimum.value = 2;
		expect(result.value).toEqual([4, 6, 8]);
	});

	it("tracks array items that are signals, computed values, or getters", () => {
		const first = signal(0);
		const second = signal(2);
		const third = computed(() => second.value + 2);
		const fourth = signal(6);
		const result = useArrayMap(
			[first, second, third, () => fourth.value],
			(value) => value * 2,
		);

		expect(result.value).toEqual([0, 4, 8, 12]);

		first.value = 1;
		second.value = 3;
		fourth.value = 7;

		expect(result.value).toEqual([2, 6, 10, 14]);
	});

	it("accepts readonly signal arrays and readonly signal items", () => {
		const first = readonly(signal(1));
		const second = readonly(signal(2));
		const list = readonly(signal([first, second]));
		const result = useArrayMap(list, (value) => value * 2);

		expect(result.value).toEqual([2, 4]);
	});

	it("passes the item index and resolved source array to the callback", () => {
		const first = signal(1);
		const second = signal(2);
		const callback = vi.fn((value: number, index: number, array: number[]) => {
			return value + index + array.length;
		});
		const result = useArrayMap([first, second], callback);

		expect(result.value).toEqual([3, 5]);
		expect(callback).toHaveBeenNthCalledWith(1, 1, 0, [1, 2]);
		expect(callback).toHaveBeenNthCalledWith(2, 2, 1, [1, 2]);
	});

	it("calls the callback for every item", () => {
		const callback = vi.fn((value: number) => value > 1);
		const result = useArrayMap([1, 2, 3], callback);

		expect(result.value).toEqual([false, true, true]);
		expect(callback).toHaveBeenCalledTimes(3);
	});

	it("matches the callback return type at runtime", () => {
		const strings = useArrayMap([0, 1, 2], (value) => value.toString());
		const objects = useArrayMap([0, 1, 2], (value) => ({ value }));

		expect(strings.value).toEqual(["0", "1", "2"]);
		expect(objects.value).toEqual([{ value: 0 }, { value: 1 }, { value: 2 }]);
	});

	it("does not resolve callback return values", () => {
		const mapped = signal("mapped");
		const result = useArrayMap([1], () => mapped);

		expect(result.value).toEqual([mapped]);

		mapped.value = "next";
		expect(result.value).toEqual([mapped]);
	});

	it("tracks signals read inside the callback", () => {
		const multiplier = signal(2);
		const result = useArrayMap([1, 2, 3], (value) => {
			return value * multiplier.value;
		});

		expect(result.value).toEqual([2, 4, 6]);

		multiplier.value = 3;
		expect(result.value).toEqual([3, 6, 9]);
	});
});
