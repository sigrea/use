import { readonly, signal, watch } from "@sigrea/core";
import type { ReadonlySignal } from "@sigrea/core";

import { resolveValue } from "../../shared/resolveValue";
import type { MaybeValue } from "../types";

export function usePrevious<T>(
	value: MaybeValue<T>,
): ReadonlySignal<T | undefined>;
export function usePrevious<T>(
	value: MaybeValue<T>,
	initialValue: T,
): ReadonlySignal<T>;
export function usePrevious<T>(
	value: MaybeValue<T>,
	initialValue?: T,
): ReadonlySignal<T | undefined> {
	const previous = signal<T | undefined>(initialValue);

	watch(
		() => resolveValue(value),
		(_, oldValue) => {
			previous.value = oldValue;
		},
		{ flush: "sync" },
	);

	return readonly(previous);
}
