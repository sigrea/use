// @vitest-environment node

import { computed, readonly, signal } from "@sigrea/core";
import { describe, expect, it, vi } from "vitest";

import { useArrayReduce } from "./index";

describe("useArrayReduce", () => {
	it("reduces raw arrays without an initial value", () => {
		const result = useArrayReduce([1, 2, 3], (sum, value) => sum + value);

		expect(result.value).toBe(6);
	});

	it("matches native empty array behavior", () => {
		const withoutInitialValue = useArrayReduce<number>(
			[],
			(sum, value) => sum + value,
		);
		const withInitialValue = useArrayReduce<number, number>(
			[],
			(sum, value) => sum + value,
			0,
		);

		expect(() => withoutInitialValue.value).toThrow(TypeError);
		expect(withInitialValue.value).toBe(0);
	});

	it("tracks signal array replacement", () => {
		const list = signal([1, 2]);
		const result = useArrayReduce(list, (sum, value) => sum + value);

		expect(result.value).toBe(3);

		list.value = [1, 2, 3];
		expect(result.value).toBe(6);
	});

	it("tracks computed and getter arrays", () => {
		const source = signal([1, 2, 3]);
		const minimum = signal(0);
		const list = computed(() =>
			source.value.filter((value) => value >= minimum.value),
		);
		const result = useArrayReduce(
			() => list.value,
			(sum, value) => sum + value,
		);

		expect(result.value).toBe(6);

		minimum.value = 2;
		expect(result.value).toBe(5);
	});

	it("tracks array items that are signals, computed values, or getters", () => {
		const first = signal(1);
		const second = signal(2);
		const third = computed(() => second.value + 1);
		const fourth = signal(4);
		const result = useArrayReduce(
			[first, second, third, () => fourth.value],
			(sum, value) => sum + value,
		);

		expect(result.value).toBe(10);

		first.value = 2;
		second.value = 3;
		fourth.value = 5;

		expect(result.value).toBe(14);
	});

	it("keeps a single unprocessed item unresolved without an initial value", () => {
		const item = signal(1);
		const reducer = vi.fn((sum: number, value: number) => sum + value);
		const result = useArrayReduce([item], reducer);

		expect(result.value).toBe(item);
		expect(reducer).not.toHaveBeenCalled();
	});

	it("accepts readonly signal arrays and readonly signal items", () => {
		const first = readonly(signal(1));
		const second = readonly(signal(2));
		const list = readonly(signal([first, second]));
		const result = useArrayReduce(list, (sum, value) => sum + value);

		expect(result.value).toBe(3);
	});

	it("uses an initial value", () => {
		const list = signal([{ num: 1 }, { num: 2 }]);
		const result = useArrayReduce(list, (sum, value) => sum + value.num, 0);

		expect(result.value).toBe(3);

		list.value = [{ num: 1 }, { num: 2 }, { num: 3 }];
		expect(result.value).toBe(6);
	});

	it("tracks reactive initial values", () => {
		const initialValue = signal(1);
		const result = useArrayReduce(
			[1, 2],
			(sum, value) => sum + value,
			initialValue,
		);

		expect(result.value).toBe(4);

		initialValue.value = 2;
		expect(result.value).toBe(5);
	});

	it("creates fresh getter initial values for each run", () => {
		const list = signal([{ num: 1 }, { num: 2 }]);
		const result = useArrayReduce(
			list,
			(values, value) => {
				values.push(value.num);
				return values;
			},
			() => [] as number[],
		);

		expect(result.value).toEqual([1, 2]);

		list.value = [{ num: 1 }, { num: 2 }, { num: 3 }];
		expect(result.value).toEqual([1, 2, 3]);
	});

	it("treats explicit undefined as an initial value", () => {
		const reducer = vi.fn((sum: number | undefined, value: number) => {
			return (sum ?? 0) + value;
		});
		const result = useArrayReduce<number, number | undefined>(
			[1],
			reducer,
			undefined,
		);

		expect(result.value).toBe(1);
		expect(reducer).toHaveBeenCalledWith(undefined, 1, 0);
	});

	it("passes the current index to the reducer", () => {
		const reducer = vi.fn(
			(sum: number, value: number, index: number) => sum + value + index,
		);
		const result = useArrayReduce([1, 2], reducer, 0);

		expect(result.value).toBe(4);
		expect(reducer).toHaveBeenNthCalledWith(1, 0, 1, 0);
		expect(reducer).toHaveBeenNthCalledWith(2, 1, 2, 1);
	});

	it("resolves accumulator values before each reducer call", () => {
		const accumulated = signal(2);
		const reducer = vi.fn(
			(sum: number | typeof accumulated, value: number, index: number) => {
				return index === 0 ? accumulated : (sum as number) + value;
			},
		);
		const result = useArrayReduce<number, number | typeof accumulated>(
			[1, 2],
			reducer,
			0,
		);

		expect(result.value).toBe(4);
		expect(reducer).toHaveBeenNthCalledWith(1, 0, 1, 0);
		expect(reducer).toHaveBeenNthCalledWith(2, 2, 2, 1);
	});

	it("tracks signals read inside the reducer", () => {
		const multiplier = signal(2);
		const result = useArrayReduce(
			[1, 2, 3],
			(sum, value) => sum + value * multiplier.value,
			0,
		);

		expect(result.value).toBe(12);

		multiplier.value = 3;
		expect(result.value).toBe(18);
	});

	it("does not resolve the final reducer return value", () => {
		const mapped = signal("mapped");
		const result = useArrayReduce<number, string | typeof mapped>(
			[1],
			() => mapped,
			"initial",
		);

		expect(result.value).toBe(mapped);

		mapped.value = "next";
		expect(result.value).toBe(mapped);
	});

	it("does not resolve an unprocessed native reduce result", () => {
		const mapped = signal("mapped");
		const result = useArrayReduce([mapped], () => "unused");

		expect(result.value).toBe(mapped);

		mapped.value = "next";
		expect(result.value).toBe(mapped);
	});
});
