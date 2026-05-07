// @vitest-environment node

import { signal } from "@sigrea/core";
import { describe, expect, it } from "vitest";

import { createProjection } from "./index";

describe("createProjection", () => {
	it("projects a numeric input between two domains", () => {
		const fromStart = signal(0);
		const fromEnd = signal(10);
		const toDomain = signal<readonly [number, number]>([50, 100]);
		const useProjection = createProjection(
			() => [fromStart.value, fromEnd.value] as const,
			toDomain,
		);
		const input = signal(0);
		const output = useProjection(input);

		expect(output.value).toBe(50);

		input.value = 10;
		expect(output.value).toBe(100);

		input.value = 5;
		expect(output.value).toBe(75);

		input.value = 1;
		expect(output.value).toBe(55);

		fromEnd.value = 20;
		expect(output.value).toBe(52.5);

		toDomain.value = [80, 120];
		expect(output.value).toBe(82);
	});

	it("accepts a custom numeric projector", () => {
		const input = signal(5);
		const useProjection = createProjection(
			[0, 10] as const,
			[100, 200] as const,
			(value, from, to) => {
				const clamped = Math.min(Math.max(value, from[0]), from[1]);
				const ratio = (clamped - from[0]) / (from[1] - from[0]);
				return ratio * (to[1] - to[0]) + to[0];
			},
		);
		const output = useProjection(input);

		expect(output.value).toBe(150);

		input.value = 20;
		expect(output.value).toBe(200);
	});

	it("extrapolates values outside the source domain", () => {
		const input = signal(20);
		const useProjection = createProjection([0, 10] as const, [0, 100] as const);
		const output = useProjection(input);

		expect(output.value).toBe(200);

		input.value = -5;
		expect(output.value).toBe(-50);
	});
});
