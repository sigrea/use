import { createProjection } from "../createProjection";
import type {
	MaybeValue,
	ProjectorFunction,
	UseProjectionReturn,
} from "../types";

/**
 * Reactive numeric projection from one domain to another.
 */
export function useProjection(
	input: MaybeValue<number>,
	fromDomain: MaybeValue<readonly [number, number]>,
	toDomain: MaybeValue<readonly [number, number]>,
	projector?: ProjectorFunction<number, number>,
): UseProjectionReturn {
	return createProjection(fromDomain, toDomain, projector)(input);
}
