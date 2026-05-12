import { computed, readonly } from "@sigrea/core";

import { resolveValue } from "../../shared/resolveValue";
import type {
	MaybeValue,
	UsePrecisionMath,
	UsePrecisionOptions,
	UsePrecisionReturn,
} from "../types";

function shiftDecimal(value: number, digits: number): number {
	if (digits === 0) {
		return value;
	}

	const [coefficient, exponent = "0"] = value.toString().split("e");

	return Number(`${coefficient}e${Number(exponent) + digits}`);
}

function adjustPrecision(
	value: number,
	digits: number,
	math: UsePrecisionMath,
): number {
	if (!Number.isFinite(value) || !Number.isInteger(digits)) {
		const power = 10 ** digits;

		return Math[math](value * power) / power;
	}

	return shiftDecimal(Math[math](shiftDecimal(value, digits)), -digits);
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
			const math = resolvedOptions?.math ?? "round";

			return adjustPrecision(resolvedValue, resolvedDigits, math);
		}),
	);
}
