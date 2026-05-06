import { readonly, signal, watch } from "@sigrea/core";
import type { ReadonlySignal, WatchSource } from "@sigrea/core";

import type { UseLastChangedOptions } from "../types";

export function useLastChanged<T>(
	source: WatchSource<T>,
	options: UseLastChangedOptions<true, number | null | undefined> & {
		immediate: true;
	},
): ReadonlySignal<number>;
export function useLastChanged<T>(
	source: WatchSource<T>,
	options: UseLastChangedOptions<boolean, number> & { initialValue: number },
): ReadonlySignal<number>;
export function useLastChanged<T>(
	source: WatchSource<T>,
	options?: UseLastChangedOptions<boolean, number | null | undefined>,
): ReadonlySignal<number | null>;
export function useLastChanged<T>(
	source: WatchSource<T>,
	options: UseLastChangedOptions<boolean, number | null | undefined> = {},
): ReadonlySignal<number | null> {
	const { initialValue = null, ...watchOptions } = options;
	const lastChanged = signal<number | null>(initialValue);

	watch(
		source,
		() => {
			lastChanged.value = Date.now();
		},
		watchOptions,
	);

	return readonly(lastChanged);
}
