import { isRaw, isSignal, markRaw, toRawDeepSignal } from "@sigrea/core";

import { reactiveComputed } from "../reactiveComputed";
import type { ReactiveOmitPredicate, ReactiveOmitReturn } from "../types";

type SourceObject = object;

const rawSkipKey = "__v_skip";
const forwardingObjectCache = new WeakMap<object, object>();

function toArray<T>(value: T | readonly T[]): readonly T[] {
	return Array.isArray(value) ? (value as readonly T[]) : [value as T];
}

function toComparableKey(key: PropertyKey): PropertyKey {
	return typeof key === "number" ? String(key) : key;
}

function resolveSignalValue(value: unknown): unknown {
	return isSignal(value) ? value.value : value;
}

function isForwardableObject(value: unknown): value is SourceObject {
	return (
		typeof value === "object" &&
		value !== null &&
		!(value instanceof Date) &&
		!(value instanceof RegExp)
	);
}

function writeObjectValue(
	obj: object,
	key: PropertyKey,
	value: unknown,
): boolean {
	const currentValue = Reflect.get(obj, key);
	if (isSignal(currentValue) && !isSignal(value)) {
		currentValue.value = value;
		return true;
	}
	return Reflect.set(obj, key, value);
}

function createForwardingTarget(source: SourceObject): SourceObject {
	if (Array.isArray(source)) {
		return markRaw([]) as SourceObject;
	}
	if (source instanceof Map) {
		return markRaw(new Map()) as SourceObject;
	}
	if (source instanceof Set) {
		return markRaw(new Set()) as SourceObject;
	}
	if (source instanceof WeakMap) {
		return markRaw(new WeakMap()) as SourceObject;
	}
	if (source instanceof WeakSet) {
		return markRaw(new WeakSet()) as SourceObject;
	}
	return markRaw(Object.create(null)) as SourceObject;
}

function syncArrayLength(target: SourceObject, source: SourceObject): void {
	if (Array.isArray(target) && Array.isArray(source)) {
		target.length = source.length;
	}
}

function readForwardedProperty(
	target: SourceObject,
	source: SourceObject,
	key: PropertyKey,
): unknown {
	if (key === rawSkipKey) {
		return Reflect.get(target, key);
	}

	const value = Reflect.get(source, key, source);
	if (typeof value === "function") {
		return value.bind(source);
	}
	return resolveForwardedValue(value);
}

function resolveForwardedValue(value: unknown): unknown {
	if (isSignal(value)) {
		return value.value;
	}

	const resolvedValue = value;
	if (!isForwardableObject(resolvedValue)) {
		return resolvedValue;
	}
	if (isRaw(resolvedValue)) {
		return resolvedValue;
	}

	const cached = forwardingObjectCache.get(resolvedValue);
	if (cached !== undefined) {
		return cached;
	}

	const target = createForwardingTarget(resolvedValue);
	const forwarded = new Proxy(target, {
		get(target, key) {
			return readForwardedProperty(target, resolvedValue, key);
		},
		set(_target, key, nextValue) {
			return writeObjectValue(resolvedValue, key, nextValue);
		},
		deleteProperty(_target, key) {
			return Reflect.deleteProperty(resolvedValue, key);
		},
		has(_target, key) {
			return key === rawSkipKey || Reflect.has(resolvedValue, key);
		},
		ownKeys() {
			syncArrayLength(target, resolvedValue);
			return Reflect.ownKeys(resolvedValue);
		},
		getOwnPropertyDescriptor(target, key) {
			if (key === rawSkipKey) {
				return Reflect.getOwnPropertyDescriptor(target, key);
			}
			if (key === "length" && Array.isArray(target)) {
				syncArrayLength(target, resolvedValue);
				return Reflect.getOwnPropertyDescriptor(target, key);
			}

			const descriptor = Reflect.getOwnPropertyDescriptor(resolvedValue, key);
			if (descriptor === undefined) {
				return undefined;
			}
			return {
				enumerable: descriptor.enumerable,
				configurable: true,
			};
		},
		defineProperty(_target, key, descriptor) {
			return Reflect.defineProperty(resolvedValue, key, descriptor);
		},
	});

	forwardingObjectCache.set(resolvedValue, forwarded);
	return forwarded;
}

function readSourceValue<T extends object>(obj: T, key: keyof T): unknown {
	return resolveSignalValue(Reflect.get(obj, key));
}

function readForwardedSourceValue<T extends object>(
	obj: T,
	key: keyof T,
): unknown {
	const rawSource = toRawDeepSignal(obj);
	if (isForwardableObject(rawSource)) {
		const rawValue = Reflect.get(rawSource, key);
		if (isSignal(rawValue)) {
			return rawValue.value;
		}
	}

	return resolveForwardedValue(Reflect.get(obj, key));
}

function writeSourceValue<T extends object>(
	obj: T,
	key: keyof T,
	value: unknown,
): boolean {
	return writeObjectValue(obj, key, value);
}

function enumerableKeys<T extends object>(obj: T): Array<keyof T> {
	return Reflect.ownKeys(obj).filter((key) =>
		Object.prototype.propertyIsEnumerable.call(obj, key),
	) as Array<keyof T>;
}

function defineForwardingProperty<T extends object>(
	result: SourceObject,
	obj: T,
	key: keyof T,
): void {
	Object.defineProperty(result, key, {
		enumerable: true,
		configurable: true,
		get() {
			return readForwardedSourceValue(obj, key);
		},
		set(value) {
			writeSourceValue(obj, key, value);
		},
	});
}

function createOmittedObject<T extends object>(
	obj: T,
	shouldOmit: (key: keyof T) => boolean,
): Partial<T> {
	const result: SourceObject = {};

	for (const key of enumerableKeys(obj)) {
		if (!shouldOmit(key)) {
			defineForwardingProperty(result, obj, key);
		}
	}

	return result as Partial<T>;
}

function createPredicateOmittedObject<T extends object>(
	obj: T,
	shouldOmit: (value: T[keyof T], key: keyof T) => boolean,
): Partial<T> {
	const result: SourceObject = {};

	for (const key of enumerableKeys(obj)) {
		const value = readSourceValue(obj, key) as T[keyof T];
		if (shouldOmit(value, key)) {
			continue;
		}

		defineForwardingProperty(result, obj, key);
	}

	return result as Partial<T>;
}

export function reactiveOmit<T extends object>(
	obj: T,
): ReactiveOmitReturn<T, never>;

export function reactiveOmit<T extends object, K extends keyof T>(
	obj: T,
	...keys: readonly (K | readonly K[])[]
): ReactiveOmitReturn<T, K>;

export function reactiveOmit<T extends object>(
	obj: T,
	predicate: ReactiveOmitPredicate<T>,
): ReactiveOmitReturn<T>;

export function reactiveOmit<T extends object, K extends keyof T>(
	obj: T,
	...keysOrPredicate: readonly (K | readonly K[] | ReactiveOmitPredicate<T>)[]
): ReactiveOmitReturn<T, K> {
	const first = keysOrPredicate[0];

	if (typeof first === "function") {
		const predicate = first as ReactiveOmitPredicate<T>;
		return reactiveComputed(() =>
			createPredicateOmittedObject(obj, (value, key) =>
				predicate(value as Parameters<ReactiveOmitPredicate<T>>[0], key),
			),
		) as ReactiveOmitReturn<T, K>;
	}

	const keySet = new Set<PropertyKey>(
		keysOrPredicate
			.flatMap((key) => toArray(key as K | readonly K[]))
			.map((key) => toComparableKey(key)),
	);

	return reactiveComputed(() =>
		createOmittedObject(obj, (key) => keySet.has(toComparableKey(key))),
	) as ReactiveOmitReturn<T, K>;
}
