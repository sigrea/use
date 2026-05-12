import { computed, isComputed, isSignal } from "@sigrea/core";
import type { Computed, Signal } from "@sigrea/core";

import type { SignalDefaultReturn } from "../types";

type SignalDefaultSourceGuard<TSource> = TSource extends Computed<unknown>
	? [sourceMustNotBeComputed: never]
	: TSource extends Signal<unknown>
		? []
		: [sourceMustBeSignal: never];

type SignalDefaultSourceValue<TSource> = TSource extends Signal<infer Value>
	? Value
	: never;

type SignalDefaultValue<TSource, TDefault> =
	| NonNullable<SignalDefaultSourceValue<TSource>>
	| TDefault;

function getValueDescriptor(source: object): PropertyDescriptor | undefined {
	let current: object | null = source;

	while (current !== null) {
		const descriptor = Object.getOwnPropertyDescriptor(current, "value");
		if (descriptor !== undefined) {
			return descriptor;
		}

		current = Object.getPrototypeOf(current);
	}
}

function getComputedSetter(source: object): unknown {
	return Reflect.get(source, "setter");
}

function isWritableSignalSource(source: unknown): source is Signal<unknown> {
	if (typeof source !== "object" || source === null || !isSignal(source)) {
		return false;
	}
	if (isComputed(source)) {
		return typeof getComputedSetter(source) === "function";
	}

	return typeof getValueDescriptor(source)?.set === "function";
}

export function signalDefault<
	const TSource,
	const TDefault extends SignalDefaultSourceValue<TSource>,
>(
	source: TSource,
	defaultValue: TDefault & NoInfer<SignalDefaultSourceValue<TSource>>,
	..._guard: SignalDefaultSourceGuard<TSource>
): SignalDefaultReturn<SignalDefaultValue<TSource, TDefault>> {
	if (!isWritableSignalSource(source)) {
		throw new TypeError("signalDefault source must be a writable signal.");
	}

	const writableSource = source as Signal<SignalDefaultSourceValue<TSource>>;

	return computed<SignalDefaultValue<TSource, TDefault>>({
		get: () =>
			(writableSource.value ?? defaultValue) as SignalDefaultValue<
				TSource,
				TDefault
			>,
		set: (next) => {
			writableSource.value = next as SignalDefaultSourceValue<TSource>;
		},
	});
}
