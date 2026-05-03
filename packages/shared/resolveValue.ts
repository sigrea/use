import { toValue } from "@sigrea/core";

import type { MaybeValue } from "./types";

export function resolveValue<T>(source: MaybeValue<T>): T {
	return toValue(source as T | (() => T));
}
