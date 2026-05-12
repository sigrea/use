import { computed } from "@sigrea/core";

import { resolveValue } from "../../shared/resolveValue";

import { createSignal } from "../createSignal";
import type { MaybeValue, SignalAutoResetReturn } from "../types";
import { useTimeoutFn } from "../useTimeoutFn";

export function signalAutoReset<T>(
	defaultValue: MaybeValue<T>,
	afterMs: MaybeValue<number> = 10000,
): SignalAutoResetReturn<T> {
	const value = createSignal(resolveValue(defaultValue));
	const reset = () => {
		value.value = resolveValue(defaultValue);
	};
	const timer = useTimeoutFn(reset, afterMs, { immediate: false });

	return computed({
		get: () => value.value,
		set: (next: T) => {
			value.value = next;
			timer.stop();
			timer.start();
		},
	}) as SignalAutoResetReturn<T>;
}
