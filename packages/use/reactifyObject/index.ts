import { reactify } from "../reactify";
import type {
	ReactifyNested,
	ReactifyObjectOptions,
	ReactifyObjectReturn,
} from "../types";

function collectKeys<T extends object>(
	obj: T,
	optionsOrKeys: ReactifyObjectOptions | readonly (keyof T)[],
): Array<keyof T> {
	if (Array.isArray(optionsOrKeys)) {
		return [...optionsOrKeys];
	}

	const options = optionsOrKeys as ReactifyObjectOptions;
	const { includeOwnProperties = true } = options;
	const keys = new Set<PropertyKey>(
		includeOwnProperties
			? Reflect.ownKeys(obj)
			: Reflect.ownKeys(obj).filter((key) =>
					Object.prototype.propertyIsEnumerable.call(obj, key),
				),
	);

	let prototype = Object.getPrototypeOf(obj);
	while (prototype !== null && prototype !== Object.prototype) {
		for (const key of Reflect.ownKeys(prototype)) {
			if (key === "constructor" || keys.has(key)) {
				continue;
			}
			const descriptor = Object.getOwnPropertyDescriptor(prototype, key);
			if (typeof descriptor?.value === "function") {
				keys.add(key);
			}
		}
		prototype = Object.getPrototypeOf(prototype);
	}

	return Array.from(keys) as Array<keyof T>;
}

function getPropertyDescriptor<T extends object>(
	obj: T,
	key: keyof T,
): PropertyDescriptor | undefined {
	let current: object | null = obj;
	while (current !== null) {
		const descriptor = Object.getOwnPropertyDescriptor(current, key);
		if (descriptor !== undefined) {
			return descriptor;
		}
		current = Object.getPrototypeOf(current);
	}

	return undefined;
}

function createReactifiedDescriptor<T extends object>(
	obj: T,
	descriptor: PropertyDescriptor,
): PropertyDescriptor {
	if ("value" in descriptor && typeof descriptor.value === "function") {
		return {
			...descriptor,
			value: reactify(descriptor.value.bind(obj)),
		};
	}

	return descriptor;
}

function createReactifiedObject<T extends object>(
	obj: T,
	keys: Array<keyof T>,
): ReactifyNested<T> {
	const result = {};

	for (const key of keys) {
		const descriptor = getPropertyDescriptor(obj, key);
		if (descriptor === undefined) {
			continue;
		}
		Object.defineProperty(
			result,
			key,
			createReactifiedDescriptor(obj, descriptor),
		);
	}

	return result as ReactifyNested<T>;
}

export function reactifyObject<T extends object, TKeys extends keyof T>(
	obj: T,
	keys: readonly TKeys[],
): ReactifyObjectReturn<T, TKeys>;

export function reactifyObject<T extends object>(
	obj: T,
	options?: ReactifyObjectOptions,
): ReactifyObjectReturn<T, keyof T>;

export function reactifyObject<T extends object>(
	obj: T,
	optionsOrKeys: ReactifyObjectOptions | readonly (keyof T)[] = {},
): ReactifyObjectReturn<T, keyof T> {
	return createReactifiedObject(obj, collectKeys(obj, optionsOrKeys));
}
