import { computed, readonly, signal, watch } from "@sigrea/core";

import type { ComputedEagerOptions, ComputedEagerReturn } from "../types";

export function computedEager<T>(
	fn: () => T,
	options: ComputedEagerOptions = {},
): ComputedEagerReturn<T> {
	const source = computed(fn);
	const result = signal(source.value);
	let watchStarted = false;

	watch(
		source,
		(value) => {
			watchStarted = true;
			result.value = value;
		},
		{
			immediate: true,
			...options,
			flush: options.flush ?? "sync",
		},
	);

	return readonly(
		computed(() => {
			if (!watchStarted) {
				result.value = source.value;
			}
			return result.value;
		}),
	);
}
