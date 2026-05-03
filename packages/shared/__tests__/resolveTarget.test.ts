import { signal } from "@sigrea/core";
import { describe, expect, expectTypeOf, it } from "vitest";

import { resolveTarget } from "../resolveTarget";

describe("resolveTarget", () => {
	it("normalizes nullish targets to undefined", () => {
		expect(resolveTarget<HTMLButtonElement | null>(null)).toBeUndefined();
		expect(
			resolveTarget<HTMLButtonElement | undefined>(undefined),
		).toBeUndefined();
	});

	it("resolves reactive targets", () => {
		const button = document.createElement("button");
		const target = signal<HTMLButtonElement | null>(button);

		expect(resolveTarget(target)).toBe(button);

		target.value = null;

		expect(resolveTarget(target)).toBeUndefined();
	});

	it("narrows nullable targets to a non-null value", () => {
		const target = signal<HTMLButtonElement | null>(null);
		const resolved = resolveTarget(target);

		expectTypeOf(resolved).toEqualTypeOf<HTMLButtonElement | undefined>();
	});
});
