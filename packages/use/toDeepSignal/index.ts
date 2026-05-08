import { deepSignal, isComputed, isRaw, isSignal } from "@sigrea/core";
import type { Computed, ReadonlySignal, Signal } from "@sigrea/core";

import type { ToDeepSignalReturn } from "../types";

type ObjectSignalSource<T extends object> =
	| Signal<ToDeepSignalSourceObject<T>>
	| ReadonlySignal<ToDeepSignalSourceObject<T>>
	| Computed<ToDeepSignalSourceObject<T>>;

type SignalLikeObject =
	| Signal<unknown>
	| ReadonlySignal<unknown>
	| Computed<unknown>;

type ToDeepSignalSourceObject<T extends object> = T extends
	| SignalLikeObject
	| ((...args: unknown[]) => unknown)
	| readonly unknown[]
	| Map<unknown, unknown>
	| Set<unknown>
	| ReadonlyMap<unknown, unknown>
	| ReadonlySet<unknown>
	| WeakMap<object, unknown>
	| WeakSet<object>
	| ArrayBuffer
	| Date
	| RegExp
	| ArrayBufferView
	? never
	: T;

function isObject(value: unknown): value is object {
	return value !== null && typeof value === "object";
}

function isForwardableObject(value: unknown): value is object {
	if (!isObject(value)) {
		return false;
	}
	if (isRaw(value)) {
		return false;
	}
	const prototype = Object.getPrototypeOf(value);
	return prototype === Object.prototype || prototype === null;
}

function assertForwardableObject(value: unknown): asserts value is object {
	if (!isForwardableObject(value)) {
		throw new TypeError("toDeepSignal source value must be a plain object.");
	}
}

function resolveSignalValue(value: unknown): unknown {
	return isSignal(value) ? value.value : value;
}

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

function isWritableSignalValue(value: SignalLikeObject): boolean {
	if (isComputed(value)) {
		return typeof getComputedSetter(value) === "function";
	}
	return typeof getValueDescriptor(value)?.set === "function";
}

function resolveSourceValue<T extends object>(
	source: T | ObjectSignalSource<T>,
): ToDeepSignalSourceObject<T> {
	const value = isSignal(source) ? source.value : source;
	assertForwardableObject(value);
	return value as ToDeepSignalSourceObject<T>;
}

function writeObjectValue(
	obj: object,
	key: PropertyKey,
	value: unknown,
): boolean {
	const currentValue = Reflect.get(obj, key);
	if (isSignal(currentValue)) {
		if (!isWritableSignalValue(currentValue)) {
			return false;
		}
		currentValue.value = resolveSignalValue(value);
		return true;
	}
	return Reflect.set(obj, key, value);
}

function createForwardedPropertyDescriptor(
	descriptor: PropertyDescriptor,
): PropertyDescriptor {
	if ("value" in descriptor || "writable" in descriptor) {
		return {
			value: descriptor.value,
			writable: descriptor.writable,
			enumerable: descriptor.enumerable,
			configurable: true,
		};
	}

	return {
		get: descriptor.get,
		set: descriptor.set,
		enumerable: descriptor.enumerable,
		configurable: true,
	};
}

function createSourceProxy<T extends object>(
	source: T | ObjectSignalSource<T>,
): ToDeepSignalSourceObject<T> {
	assertForwardableObject(resolveSourceValue(source));

	return new Proxy(
		{},
		{
			get(_target, key, receiver) {
				return resolveSignalValue(
					Reflect.get(resolveSourceValue(source), key, receiver),
				);
			},
			set(_target, key, value) {
				return writeObjectValue(resolveSourceValue(source), key, value);
			},
			deleteProperty(_target, key) {
				return Reflect.deleteProperty(resolveSourceValue(source), key);
			},
			has(_target, key) {
				return Reflect.has(resolveSourceValue(source), key);
			},
			ownKeys() {
				return Reflect.ownKeys(resolveSourceValue(source));
			},
			getOwnPropertyDescriptor(_target, key) {
				const descriptor = Reflect.getOwnPropertyDescriptor(
					resolveSourceValue(source),
					key,
				);
				if (descriptor === undefined) {
					return undefined;
				}
				return createForwardedPropertyDescriptor(descriptor);
			},
			defineProperty(_target, key, descriptor) {
				if (descriptor.configurable !== true) {
					return false;
				}
				return Reflect.defineProperty(
					resolveSourceValue(source),
					key,
					descriptor,
				);
			},
			preventExtensions() {
				return false;
			},
		},
	) as ToDeepSignalSourceObject<T>;
}

/**
 * Converts an object or object signal into a deep signal object.
 *
 * @param source An object or signal-like object source.
 */
export function toDeepSignal<T extends object>(
	source: ObjectSignalSource<T>,
): ToDeepSignalReturn<ToDeepSignalSourceObject<T>>;
export function toDeepSignal<T extends object>(
	source: ToDeepSignalSourceObject<T>,
): ToDeepSignalReturn<ToDeepSignalSourceObject<T>>;
export function toDeepSignal<T extends object>(
	source: T | ObjectSignalSource<T>,
): ToDeepSignalReturn<ToDeepSignalSourceObject<T>> {
	return deepSignal(createSourceProxy(source)) as ToDeepSignalReturn<
		ToDeepSignalSourceObject<T>
	>;
}
