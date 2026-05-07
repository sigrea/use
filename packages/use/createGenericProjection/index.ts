import { computed, readonly } from "@sigrea/core";

import { resolveValue } from "../../shared/resolveValue";
import type { MaybeValue, ProjectorFunction, UseProjection } from "../types";

/**
 * Create a projection helper with a custom projector function.
 */
export function createGenericProjection<From = number, To = number>(
	fromDomain: MaybeValue<readonly [From, From]>,
	toDomain: MaybeValue<readonly [To, To]>,
	projector: ProjectorFunction<From, To>,
): UseProjection<From, To> {
	return (input: MaybeValue<From>) =>
		readonly(
			computed(() =>
				projector(
					resolveValue(input),
					resolveValue(fromDomain),
					resolveValue(toDomain),
				),
			),
		);
}
