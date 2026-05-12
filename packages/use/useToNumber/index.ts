import { computed, readonly } from "@sigrea/core";
import type { ReadonlySignal } from "@sigrea/core";

import { resolveValue } from "../../shared/resolveValue";
import type { MaybeValue, UseToNumberOptions } from "../types";

/**
 * Reactively convert a string to number.
 */
export function useToNumber(
	value: MaybeValue<number | string>,
	options: UseToNumberOptions = {},
): ReadonlySignal<number> {
	const { method = "parseFloat", radix, nanToZero } = options;

	return readonly(
		computed(() => {
			let resolved = resolveValue(value);

			if (typeof method === "function") {
				resolved = method(resolved);
			} else if (typeof resolved === "string") {
				resolved =
					method === "parseInt"
						? Number.parseInt(resolved, radix)
						: Number.parseFloat(resolved);
			}

			if (nanToZero === true && Number.isNaN(resolved)) {
				resolved = 0;
			}

			return resolved;
		}),
	);
}
