import { isSignal } from "@sigrea/core";
import type {
	ExtendSignalOptions,
	ExtendSignalReturn,
	ExtendSignalSource,
} from "../types";

function hasValueSetter(source: object): boolean {
	let target: object | null = source;

	while (target !== null) {
		const descriptor = Object.getOwnPropertyDescriptor(target, "value");

		if (descriptor !== undefined) {
			if ("set" in descriptor) {
				return descriptor.set !== undefined;
			}

			return descriptor.writable === true;
		}

		target = Object.getPrototypeOf(target);
	}

	return false;
}

export function extendSignal<
	R extends ExtendSignalSource,
	Extend extends object,
>(source: R, extend: Extend): ExtendSignalReturn<R, Extend, true>;
export function extendSignal<
	R extends ExtendSignalSource,
	Extend extends object,
>(
	source: R,
	extend: Extend,
	options: ExtendSignalOptions<true>,
): ExtendSignalReturn<R, Extend, true>;
export function extendSignal<
	R extends ExtendSignalSource,
	Extend extends object,
>(
	source: R,
	extend: Extend,
	options: ExtendSignalOptions<false>,
): ExtendSignalReturn<R, Extend, false>;
export function extendSignal<
	R extends ExtendSignalSource,
	Extend extends object,
	Unwrap extends boolean,
>(
	source: R,
	extend: Extend,
	options: ExtendSignalOptions<Unwrap>,
): ExtendSignalReturn<R, Extend, Unwrap>;
export function extendSignal<
	R extends ExtendSignalSource,
	Extend extends object,
>(
	source: R,
	extend: Extend,
	{ enumerable = false, unwrap = true }: ExtendSignalOptions = {},
): ExtendSignalReturn<R, Extend> {
	for (const [key, value] of Object.entries(extend)) {
		if (key === "value" || key === "peek") {
			continue;
		}

		if (unwrap && isSignal(value)) {
			const descriptor: PropertyDescriptor = {
				get() {
					return value.value;
				},
				enumerable,
			};

			if (hasValueSetter(value)) {
				descriptor.set = (nextValue: unknown) => {
					value.value = nextValue;
				};
			}

			Object.defineProperty(source, key, descriptor);
			continue;
		}

		Object.defineProperty(source, key, { value, enumerable });
	}

	return source as ExtendSignalReturn<R, Extend>;
}
