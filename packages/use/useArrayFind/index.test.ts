// @vitest-environment node

import { computed, readonly, signal } from "@sigrea/core";
import { describe, expect, it, vi } from "vitest";

import { useArrayFind } from "./index";

describe("useArrayFind", () => {
	it("finds from raw arrays", () => {
		const result = useArrayFind([-1, -2, 3], (value) => value > 0);

		expect(result.value).toBe(3);
		expect(useArrayFind([-1, -2], (value) => value > 0).value).toBeUndefined();
	});

	it("tracks signal array replacement", () => {
		const list = signal([-1, -2, 3]);
		const result = useArrayFind(list, (value) => value > 0);

		expect(result.value).toBe(3);

		list.value = [-1, 2, 3];
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
		const result = useArrayFind(
			() => list.value,
			(value) => value > 0,
		);

		expect(result.value).toBe(3);

		minimum.value = 0;
		source.value = [-1, 2, 3];

		expect(result.value).toBe(2);
	});

	it("tracks array items that are signals, computed values, or getters", () => {
		const first = signal(-1);
		const second = signal(-2);
		const third = computed(() => second.value + 4);
		const fourth = signal(-4);
		const result = useArrayFind(
			[first, second, third, () => fourth.value],
			(value) => value > 0,
		);

		expect(result.value).toBe(2);

		second.value = -5;
		expect(result.value).toBeUndefined();

		fourth.value = 4;
		expect(result.value).toBe(4);
	});

	it("returns the same resolved value used for matching", () => {
		let calls = 0;
		const item = () => {
			calls += 1;
			return calls;
		};
		const result = useArrayFind([item], (value) => value === 1);

		expect(result.value).toBe(1);
		expect(calls).toBe(1);
	});

	it("keeps Array.find iteration semantics", () => {
		const list: Array<number> = [1, 2];
		const result = useArrayFind(list, (value) => {
			if (value === 2) {
				list.push(3);
			}

			return value === 3;
		});

		expect(result.value).toBeUndefined();
		expect(list).toEqual([1, 2, 3]);
	});

	it("accepts readonly signal arrays and readonly signal items", () => {
		const first = readonly(signal(-1));
		const second = readonly(signal(2));
		const list = readonly(signal([first, second]));
		const result = useArrayFind(list, (value) => value > 0);

		expect(result.value).toBe(2);
	});

	it("passes the item index and source array to the predicate", () => {
		const first = signal(-1);
		const second = signal(2);
		const predicate = vi.fn((value: number, index: number, array) => {
			return value === index && array[index] !== value;
		});
		const result = useArrayFind([first, second], predicate);

		expect(result.value).toBeUndefined();
		expect(predicate).toHaveBeenCalledWith(-1, 0, [first, second]);
		expect(predicate).toHaveBeenCalledWith(2, 1, [first, second]);
	});

	it("tracks signals read inside the predicate", () => {
		const minimum = signal(0);
		const result = useArrayFind([1, 2, 3], (value) => {
			return value >= minimum.value;
		});

		expect(result.value).toBe(1);

		minimum.value = 2;
		expect(result.value).toBe(2);
	});
});
