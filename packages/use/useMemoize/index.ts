import { signal, untracked } from "@sigrea/core";

import type {
	UseMemoizeCache,
	UseMemoizeCacheKey,
	UseMemoizeOptions,
	UseMemoizeReturn,
} from "../types";

function defaultGetKey(args: unknown[]): string {
	return JSON.stringify(args);
}

export function useMemoize<Result, Args extends unknown[]>(
	resolver: (...args: Args) => Result,
): UseMemoizeReturn<Result, Args, string>;
export function useMemoize<
	Result,
	Args extends unknown[],
	Key extends UseMemoizeCacheKey = string,
>(
	resolver: (...args: Args) => Result,
	options: UseMemoizeOptions<Result, Args, Key>,
): UseMemoizeReturn<Result, Args, Key>;
export function useMemoize<
	Result,
	Args extends unknown[],
	Key extends UseMemoizeCacheKey = string,
>(
	resolver: (...args: Args) => Result,
	options?: UseMemoizeOptions<Result, Args, Key>,
): UseMemoizeReturn<Result, Args, Key> {
	const rawCache =
		options?.cache ?? (new Map<Key, Result>() as UseMemoizeCache<Key, Result>);
	const cacheVersion = signal(0);

	const notifyCacheChange = () => {
		cacheVersion.value = cacheVersion.peek() + 1;
	};
	const trackCache = () => {
		cacheVersion.value;
	};
	const generateKey = (...args: Args): Key =>
		options?.getKey !== undefined
			? options.getKey(...args)
			: (defaultGetKey(args) as Key);
	const loadDataByKey = (key: Key, ...args: Args): Result => {
		rawCache.set(
			key,
			untracked(() => resolver(...args)),
		);
		notifyCacheChange();
		return rawCache.get(key) as Result;
	};
	const load = (...args: Args): Result =>
		loadDataByKey(generateKey(...args), ...args);
	const deleteData = (...args: Args): void => {
		rawCache.delete(generateKey(...args));
		notifyCacheChange();
	};
	const clear = (): void => {
		rawCache.clear();
		notifyCacheChange();
	};
	const cache: UseMemoizeCache<Key, Result> = {
		get(key) {
			trackCache();
			return rawCache.get(key);
		},
		set(key, value) {
			rawCache.set(key, value);
			notifyCacheChange();
		},
		has(key) {
			trackCache();
			return rawCache.has(key);
		},
		delete(key) {
			rawCache.delete(key);
			notifyCacheChange();
		},
		clear,
	};

	const memoized = ((...args: Args): Result => {
		const key = generateKey(...args);
		const value = rawCache.has(key)
			? (rawCache.get(key) as Result)
			: loadDataByKey(key, ...args);
		trackCache();
		return value;
	}) as UseMemoizeReturn<Result, Args, Key>;

	memoized.load = load;
	memoized.delete = deleteData;
	memoized.clear = clear;
	memoized.generateKey = generateKey;
	memoized.cache = cache;

	return memoized;
}
