// @vitest-environment node

import { computed, readonly, signal } from "@sigrea/core";
import { describe, expect, it, vi } from "vitest";

import { useArrayUnique } from "./index";

describe("useArrayUnique", () => {
	it("returns unique raw array values", () => {
		const result = useArrayUnique([1, 2, 2, 3, 1]);

		expect(result.value).toEqual([1, 2, 3]);
		expect(useArrayUnique([Number.NaN, Number.NaN, 1]).value).toEqual([
			Number.NaN,
			1,
		]);
		expect(useArrayUnique([0, -0, 1]).value).toEqual([0, 1]);
		expect(useArrayUnique([]).value).toEqual([]);
	});

	it("tracks signal array replacement", () => {
		const list = signal([1, 2, 2, 3]);
		const result = useArrayUnique(list);

		expect(result.value).toEqual([1, 2, 3]);

		list.value = [1, 1, 2];
		expect(result.value).toEqual([1, 2]);
	});

	it("tracks computed and getter arrays", () => {
		const source = signal([0, 1, 1, 2, 3]);
		const minimum = signal(0);
		const list = computed(() =>
			source.value.filter((value) => value >= minimum.value),
		);
		const result = useArrayUnique(() => list.value);

		expect(result.value).toEqual([0, 1, 2, 3]);

		minimum.value = 2;
		expect(result.value).toEqual([2, 3]);
	});

	it("tracks array items that are signals, computed values, or getters", () => {
		const first = signal(0);
		const second = signal(1);
		const third = computed(() => second.value);
		const fourth = signal(3);
		const result = useArrayUnique([first, second, third, () => fourth.value]);

		expect(result.value).toEqual([0, 1, 3]);

		second.value = 2;
		expect(result.value).toEqual([0, 2, 3]);

		fourth.value = 0;
		expect(result.value).toEqual([0, 2]);
	});

	it("accepts readonly signal arrays and readonly signal items", () => {
		const first = readonly(signal(1));
		const second = readonly(signal(1));
		const list = readonly(signal([first, second]));
		const result = useArrayUnique(list);

		expect(result.value).toEqual([1]);
	});

	it("uses a custom comparison function", () => {
		const first = { id: 1, name: "foo" };
		const second = { id: 2, name: "bar" };
		const third = { id: 1, name: "baz" };
		const result = useArrayUnique(
			[first, second, third],
			(value, otherValue) => value.id === otherValue.id,
		);

		expect(result.value).toEqual([first, second]);
	});

	it("passes the resolved source array to the comparison function", () => {
		const first = signal({ id: 1 });
		const second = signal({ id: 2 });
		const third = signal({ id: 1 });
		const compare = vi.fn((value: { id: number }, otherValue, array) => {
			return value.id === otherValue.id && array[0] !== first;
		});
		const result = useArrayUnique([first, second, third], compare);

		expect(result.value).toEqual([{ id: 1 }, { id: 2 }]);
		expect(compare).toHaveBeenNthCalledWith(1, { id: 2 }, { id: 1 }, [
			{ id: 1 },
			{ id: 2 },
			{ id: 1 },
		]);
		expect(compare).toHaveBeenNthCalledWith(2, { id: 1 }, { id: 1 }, [
			{ id: 1 },
			{ id: 2 },
			{ id: 1 },
		]);
	});

	it("resolves every item before filtering duplicates", () => {
		const first = signal(1);
		const second = signal(1);
		const result = useArrayUnique([first, second]);

		expect(result.value).toEqual([1]);

		second.value = 2;
		expect(result.value).toEqual([1, 2]);
	});

	it("tracks signals read inside the comparison function", () => {
		const compareById = signal(true);
		const result = useArrayUnique(
			[
				{ id: 1, name: "foo" },
				{ id: 1, name: "bar" },
			],
			(value, otherValue) => {
				if (compareById.value) {
					return value.id === otherValue.id;
				}

				return value.name === otherValue.name;
			},
		);

		expect(result.value).toEqual([{ id: 1, name: "foo" }]);

		compareById.value = false;
		expect(result.value).toEqual([
			{ id: 1, name: "foo" },
			{ id: 1, name: "bar" },
		]);
	});
});
