import { computed, deepSignal, signal } from "@sigrea/core";

import type { CreateSignalReturn } from "../types";

export function createSignal<T = unknown, D extends boolean = false>(
	value: T,
	deep?: D,
): CreateSignalReturn<T, D> {
	if (deep === true) {
		const state = deepSignal({ value });
		return computed({
			get: () => state.value,
			set: (next) => {
				state.value = next;
			},
		}) as CreateSignalReturn<T, D>;
	}

	return signal(value) as CreateSignalReturn<T, D>;
}
