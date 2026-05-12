import { createGenericProjection } from "../createGenericProjection";
import type { MaybeValue, ProjectorFunction, UseProjection } from "../types";

function defaultNumericProjector(
	input: number,
	from: readonly [number, number],
	to: readonly [number, number],
): number {
	return ((input - from[0]) / (from[1] - from[0])) * (to[1] - to[0]) + to[0];
}

/**
 * Create a numeric projection helper from one domain to another.
 */
export function createProjection(
	fromDomain: MaybeValue<readonly [number, number]>,
	toDomain: MaybeValue<readonly [number, number]>,
	projector: ProjectorFunction<number, number> = defaultNumericProjector,
): UseProjection<number, number> {
	return createGenericProjection(fromDomain, toDomain, projector);
}
