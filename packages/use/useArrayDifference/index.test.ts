// @vitest-environment node

import { computed, readonly, signal } from "@sigrea/core";
import { describe, expect, it } from "vitest";

import { useArrayDifference } from "./index";

describe("useArrayDifference", () => {
	it("returns the relative difference of raw arrays", () => {
		const result = useArrayDifference([1, 2, 3, 4, 5], [4, 5, 6]);

		expect(result.value).toEqual([1, 2, 3]);
	});

	it("uses SameValueZero for default item comparison", () => {
		const result = useArrayDifference([Number.NaN, 0, -0, 1], [Number.NaN, -0]);
		const symmetric = useArrayDifference(
			[Number.NaN],
			[Number.NaN],
			undefined,
			{
				symmetric: true,
			},
		);

		expect(result.value).toEqual([1]);
		expect(symmetric.value).toEqual([]);
	});

	it("tracks signal source and values arrays", () => {
		const list = signal([1, 2, 3, 4, 5]);
		const values = signal([4, 5, 6]);
		const result = useArrayDifference(list, values);

		expect(result.value).toEqual([1, 2, 3]);

		values.value = [1, 2, 3];
		expect(result.value).toEqual([4, 5]);

		list.value = [1, 2, 3];
		expect(result.value).toEqual([]);
	});

	it("tracks computed and getter arrays", () => {
		const source = signal([1, 2, 3, 4, 5]);
		const hidden = signal([4, 5]);
		const list = computed(() => source.value.filter((value) => value > 1));
		const result = useArrayDifference(list, () => hidden.value);

		expect(result.value).toEqual([2, 3]);

		source.value = [2, 3, 4, 5, 6];
		hidden.value = [2, 6];

		expect(result.value).toEqual([3, 4, 5]);
	});

	it("accepts readonly signal arrays", () => {
		const list = readonly(signal([1, 2, 3]));
		const values = readonly(signal([2]));
		const result = useArrayDifference(list, values);

		expect(result.value).toEqual([1, 3]);
	});

	it("uses a comparison function", () => {
		const list = signal([
			{ id: 1 },
			{ id: 2 },
			{ id: 3 },
			{ id: 4 },
			{ id: 5 },
		]);
		const values = signal([{ id: 4 }, { id: 5 }]);
		const result = useArrayDifference(
			list,
			values,
			(value, otherValue) => value.id === otherValue.id,
		);

		expect(result.value).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);

		values.value = [{ id: 1 }, { id: 2 }, { id: 3 }];
		expect(result.value).toEqual([{ id: 4 }, { id: 5 }]);

		list.value = [{ id: 1 }, { id: 2 }, { id: 3 }];
		expect(result.value).toEqual([]);
	});

	it("uses an object key for comparison", () => {
		const list = signal([
			{ id: 1 },
			{ id: 2 },
			{ id: 3 },
			{ id: 4 },
			{ id: 5 },
		]);
		const values = signal([{ id: 3 }, { id: 4 }, { id: 5 }]);
		const result = useArrayDifference(list, values, "id");

		expect(result.value).toEqual([{ id: 1 }, { id: 2 }]);

		values.value = [{ id: 1 }, { id: 2 }];
		expect(result.value).toEqual([{ id: 3 }, { id: 4 }, { id: 5 }]);

		list.value = [{ id: 1 }, { id: 2 }];
		expect(result.value).toEqual([]);
	});

	it("returns symmetric difference when requested", () => {
		const list = signal([
			{ id: 1 },
			{ id: 2 },
			{ id: 3 },
			{ id: 4 },
			{ id: 5 },
		]);
		const values = signal([{ id: 3 }, { id: 4 }, { id: 5 }, { id: 6 }]);
		const result = useArrayDifference(list, values, "id", {
			symmetric: true,
		});

		expect(result.value).toEqual([{ id: 1 }, { id: 2 }, { id: 6 }]);

		values.value = [{ id: 1 }, { id: 2 }];
		expect(result.value).toEqual([{ id: 3 }, { id: 4 }, { id: 5 }]);
	});

	it("supports symmetric difference with a comparison function", () => {
		const list = signal([
			{ id: 1 },
			{ id: 2 },
			{ id: 3 },
			{ id: 4 },
			{ id: 5 },
		]);
		const values = signal([{ id: 3 }, { id: 4 }, { id: 5 }, { id: 6 }]);
		const result = useArrayDifference(
			list,
			values,
			(value, otherValue) => value.id === otherValue.id,
			{ symmetric: true },
		);

		expect(result.value).toEqual([{ id: 1 }, { id: 2 }, { id: 6 }]);

		values.value = [{ id: 6 }, { id: 7 }];
		expect(result.value).toEqual([
			{ id: 1 },
			{ id: 2 },
			{ id: 3 },
			{ id: 4 },
			{ id: 5 },
			{ id: 6 },
			{ id: 7 },
		]);
	});
});
