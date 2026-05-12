import { computed, deepSignal, isComputed, isSignal } from "@sigrea/core";
import type { Computed } from "@sigrea/core";

import type { ReactiveComputedGetter, ReactiveComputedReturn } from "../types";

type MutableRecord = Record<PropertyKey, unknown>;
type InferredPreviousValue = Record<PropertyKey, unknown>;
type InferredReactiveComputedGetter<T extends object> = (
	previousValue?: InferredPreviousValue,
) => T;

function resolveSignalValue(value: unknown): unknown {
	return isSignal(value) ? value.value : value;
}

function getValueDescriptor(value: object): PropertyDescriptor | undefined {
	let current: object | null = value;
	while (current !== null) {
		const descriptor = Object.getOwnPropertyDescriptor(current, "value");
		if (descriptor !== undefined) {
			return descriptor;
		}
		current = Object.getPrototypeOf(current);
	}

	return undefined;
}

function isWritableSignalValue(value: unknown): value is { value: unknown } {
	return (
		isSignal(value) &&
		!isComputed(value) &&
		typeof getValueDescriptor(value)?.set === "function"
	);
}

function createComputedProxy<T extends object>(source: Computed<T>): T {
	return new Proxy(
		{},
		{
			get(_target, key, receiver) {
				return resolveSignalValue(Reflect.get(source.value, key, receiver));
			},
			set(_target, key, value) {
				const target = source.value as MutableRecord;
				const currentValue = target[key];
				if (isWritableSignalValue(currentValue) && !isSignal(value)) {
					currentValue.value = value;
					return true;
				}
				return Reflect.set(target, key, value);
			},
			deleteProperty(_target, key) {
				return Reflect.deleteProperty(source.value, key);
			},
			has(_target, key) {
				return Reflect.has(source.value, key);
			},
			ownKeys() {
				return Reflect.ownKeys(source.value);
			},
			getOwnPropertyDescriptor(_target, key) {
				const descriptor = Reflect.getOwnPropertyDescriptor(source.value, key);
				if (descriptor === undefined) {
					return undefined;
				}
				return {
					enumerable: descriptor.enumerable,
					configurable: true,
				};
			},
			defineProperty(_target, key, descriptor) {
				return Reflect.defineProperty(source.value, key, descriptor);
			},
		},
	) as T;
}

export function reactiveComputed<
	TGetter extends InferredReactiveComputedGetter<object>,
>(fn: TGetter): ReactiveComputedReturn<ReturnType<TGetter>>;

export function reactiveComputed<T extends object>(
	fn: ReactiveComputedGetter<T>,
): ReactiveComputedReturn<T>;

export function reactiveComputed(
	fn: (previousValue?: unknown) => object,
): ReactiveComputedReturn<object> {
	let previousValue: object | undefined;
	const source = computed(() => {
		const nextValue = fn(previousValue);
		previousValue = nextValue;
		return nextValue;
	});

	return deepSignal(
		createComputedProxy(source),
	) as ReactiveComputedReturn<object>;
}
