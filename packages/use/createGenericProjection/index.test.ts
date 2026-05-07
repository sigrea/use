// @vitest-environment node

import { signal } from "@sigrea/core";
import { describe, expect, it } from "vitest";

import { createGenericProjection } from "./index";

describe("createGenericProjection", () => {
	it("creates a readonly computed projection with a custom projector", () => {
		const fromStart = signal(0);
		const fromEnd = signal(10);
		const toDomain = signal<readonly [string, string]>(["low", "high"]);
		const useProjection = createGenericProjection<number, string>(
			() => [fromStart.value, fromEnd.value] as const,
			toDomain,
			(input, from, to) => {
				const midpoint = (from[0] + from[1]) / 2;
				return input <= midpoint ? to[0] : to[1];
			},
		);
		const input = signal(1);
		const output = useProjection(input);

		expect(output.value).toBe("low");

		input.value = 9;
		expect(output.value).toBe("high");

		fromEnd.value = 20;
		expect(output.value).toBe("low");

		toDomain.value = ["cold", "hot"];
		expect(output.value).toBe("cold");
	});

	it("accepts plain values, signals, and getters", () => {
		const input = signal(2);
		const useProjection = createGenericProjection<number, number>(
			[0, 4] as const,
			() => [10, 20] as const,
			(value, from, to) => {
				const ratio = (value - from[0]) / (from[1] - from[0]);
				return ratio * (to[1] - to[0]) + to[0];
			},
		);
		const output = useProjection(input);

		expect(output.value).toBe(15);

		input.value = 4;
		expect(output.value).toBe(20);
	});
});
