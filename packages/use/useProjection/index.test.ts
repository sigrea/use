// @vitest-environment node

import { signal } from "@sigrea/core";
import { describe, expect, it } from "vitest";

import { useProjection } from "./index";

describe("useProjection", () => {
	it("projects a numeric input between two domains", () => {
		expect(useProjection(5, [0, 10], [0, 100]).value).toBe(50);
		expect(useProjection(3, [0, 10], [0, 100]).value).toBe(30);
		expect(useProjection(4, [0, 44], [0, 132]).value).toBe(12);
	});

	it("tracks input and domain sources", () => {
		const input = signal(5);
		const fromEnd = signal(10);
		const toDomain = signal<readonly [number, number]>([0, 100]);
		const result = useProjection(
			input,
			() => [0, fromEnd.value] as const,
			toDomain,
		);

		expect(result.value).toBe(50);

		input.value = 8;
		expect(result.value).toBe(80);

		fromEnd.value = 20;
		expect(result.value).toBe(40);

		toDomain.value = [100, 200];
		expect(result.value).toBe(140);
	});

	it("accepts getter input", () => {
		const input = signal(4);
		const result = useProjection(() => input.value, [0, 10], [0, 100]);

		expect(result.value).toBe(40);

		input.value = 7;
		expect(result.value).toBe(70);
	});

	it("accepts a custom numeric projector", () => {
		const input = signal(5);
		const result = useProjection(
			input,
			[0, 10] as const,
			[100, 200] as const,
			(value, from, to) => {
				const clamped = Math.min(Math.max(value, from[0]), from[1]);
				const ratio = (clamped - from[0]) / (from[1] - from[0]);
				return ratio * (to[1] - to[0]) + to[0];
			},
		);

		expect(result.value).toBe(150);

		input.value = 20;
		expect(result.value).toBe(200);
	});
});
