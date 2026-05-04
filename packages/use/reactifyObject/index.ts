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
	if (includeOwnProperties) {
		return Reflect.ownKeys(obj) as Array<keyof T>;
	}

	return Reflect.ownKeys(obj).filter((key) =>
		Object.prototype.propertyIsEnumerable.call(obj, key),
	) as Array<keyof T>;
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
	const entries = collectKeys(obj, optionsOrKeys).map((key) => {
		const value = obj[key];

		return [
			key,
			typeof value === "function" ? reactify(value.bind(obj)) : value,
		];
	});

	return Object.fromEntries(entries) as ReactifyNested<T>;
}
