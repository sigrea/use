import {
	getCurrentScope,
	isSignal,
	onDispose,
	onMount,
	readonly,
	signal,
	untracked,
	watch,
} from "@sigrea/core";
import type { WatchSource } from "@sigrea/core";

import type {
	UseCachedComparator,
	UseCachedOptions,
	UseCachedReturn,
} from "../types";

function defaultComparator<T>(newSourceValue: T, cachedValue: T): boolean {
	return Object.is(newSourceValue, cachedValue);
}

function readSource<T>(source: WatchSource<T>): T {
	if (typeof source === "function") {
		return (source as () => T)();
	}
	if (isSignal(source)) {
		return source.value as T;
	}
	return source as T;
}

/**
 * Cache a reactive value with a custom comparator.
 */
export function useCached<T>(
	source: WatchSource<T>,
	comparator: UseCachedComparator<T> = defaultComparator,
	options: UseCachedOptions = {},
): UseCachedReturn<T> {
	const { deep = false, flush = "sync" } = options;
	const cached = signal(readSource(source));
	let stopped = false;
	const updateCachedValue = (value: T) => {
		const shouldKeepCache = untracked(() => comparator(value, cached.peek()));
		if (!stopped && !shouldKeepCache) {
			cached.value = value;
		}
	};

	const stop = watch(source, updateCachedValue, { deep, flush });
	const stopCached = () => {
		if (stopped) {
			return;
		}

		stopped = true;
		stop();
	};

	try {
		onMount(() => {
			updateCachedValue(readSource(source));
		});
	} catch {}

	const scope = getCurrentScope();
	if (scope !== undefined) {
		onDispose(stopCached, scope);
	}

	return readonly(cached);
}
