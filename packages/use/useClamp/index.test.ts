// @vitest-environment node

import { computed, readonly, signal } from "@sigrea/core";
import { describe, expect, it } from "vitest";

import { useClamp } from "./index";

describe("useClamp", () => {
	it("returns a writable computed value for plain numbers", () => {
		const result = useClamp(10, 0, 100);

		expect(result.value).toBe(10);

		result.value = 1000;
		expect(result.value).toBe(100);

		result.value = -100;
		expect(result.value).toBe(0);
	});

	it("preserves the plain number source when bounds change", () => {
		const min = signal(0);
		const max = signal(100);
		const result = useClamp(10, min, max);

		expect(result.value).toBe(10);

		min.value = 20;
		expect(result.value).toBe(20);

		min.value = 0;
		expect(result.value).toBe(10);

		max.value = 5;
		expect(result.value).toBe(5);

		max.value = 100;
		expect(result.value).toBe(10);
	});

	it("tracks signal sources and bounds without writing back", () => {
		const source = signal(10);
		const min = signal(0);
		const max = signal(100);
		const result = useClamp(source, min, max);

		expect(result.value).toBe(10);

		source.value = 1000;
		expect(result.value).toBe(100);
		expect(source.value).toBe(1000);

		max.value = 90;
		expect(result.value).toBe(90);
		expect(source.value).toBe(1000);

		source.value = -10;
		expect(result.value).toBe(0);
		expect(source.value).toBe(-10);

		min.value = 20;
		expect(result.value).toBe(20);
		expect(source.value).toBe(-10);
	});

	it("tracks getter, computed, and readonly signal sources without writing back", () => {
		const source = signal(10);
		const min = signal(0);
		const max = signal(100);
		const getterResult = useClamp(() => source.value, min, max);
		const computedResult = useClamp(
			computed(() => source.value),
			min,
			max,
		);
		const readonlyResult = useClamp(readonly(source), min, max);

		expect(getterResult.value).toBe(10);
		expect(computedResult.value).toBe(10);
		expect(readonlyResult.value).toBe(10);

		source.value = 110;
		expect(getterResult.value).toBe(100);
		expect(computedResult.value).toBe(100);
		expect(readonlyResult.value).toBe(100);
		expect(source.value).toBe(110);

		max.value = 90;
		expect(getterResult.value).toBe(90);
		expect(computedResult.value).toBe(90);
		expect(readonlyResult.value).toBe(90);
		expect(source.value).toBe(110);
	});

	it("treats writable computed inputs as readonly sources", () => {
		const source = signal(10);
		const min = signal(0);
		const max = signal(100);
		const writableComputed = computed({
			get: () => source.value,
			set: (next: number) => {
				source.value = next;
			},
		});
		const result = useClamp(writableComputed, min, max);

		expect(result.value).toBe(10);

		source.value = 110;
		expect(result.value).toBe(100);
		expect(source.value).toBe(110);

		max.value = 90;
		expect(result.value).toBe(90);
		expect(source.value).toBe(110);
	});
});
