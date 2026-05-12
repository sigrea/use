import type { Computed, ReadonlySignal, Signal } from "@sigrea/core";

import { resolveValue } from "../../shared/resolveValue";
import { createSignal } from "../createSignal";
import { extendSignal } from "../extendSignal";
import type { MaybeValue, SignalManualResetReturn } from "../types";

type FunctionValue = (...args: never[]) => unknown;
type WrappedValue<T> = Signal<T> | ReadonlySignal<T> | Computed<T>;

type RawSignalManualResetDefault<T> = T extends FunctionValue ? never : T;
type WrappedSignalManualResetDefault<T> = WrappedValue<T> | (() => T);

export function signalManualReset<T>(
	defaultValue: WrappedSignalManualResetDefault<T>,
): SignalManualResetReturn<T>;
export function signalManualReset<T>(
	defaultValue: RawSignalManualResetDefault<T>,
): SignalManualResetReturn<T>;
export function signalManualReset<T>(
	defaultValue: MaybeValue<T>,
): SignalManualResetReturn<T> {
	const value = createSignal(resolveValue(defaultValue));
	const reset = () => {
		value.value = resolveValue(defaultValue);
	};

	return extendSignal(value, { reset }) as SignalManualResetReturn<T>;
}
