import { computed, readonly } from "@sigrea/core";

import { resolveValue } from "../../shared/resolveValue";
import type {
	MaybeValue,
	UsePrecisionOptions,
	UsePrecisionReturn,
} from "../types";

function accurateMultiply(value: number, power: number): number {
	const valueStr = value.toString();

	if (value > 0 && valueStr.includes(".")) {
		const decimalPlaces = valueStr.split(".")[1].length;
		const multiplier = 10 ** decimalPlaces;

		return (value * multiplier * power) / multiplier;
	}

	return value * power;
}

/**
 * Reactively set the precision of a number.
 */
export function usePrecision(
	value: MaybeValue<number>,
	digits: MaybeValue<number>,
	options?: MaybeValue<UsePrecisionOptions>,
): UsePrecisionReturn {
	return readonly(
		computed(() => {
			const resolvedValue = resolveValue(value);
			const resolvedDigits = resolveValue(digits);
			const resolvedOptions =
				options === undefined ? undefined : resolveValue(options);
			const power = 10 ** resolvedDigits;
			const math = resolvedOptions?.math ?? "round";

			return Math[math](accurateMultiply(resolvedValue, power)) / power;
		}),
	);
}
