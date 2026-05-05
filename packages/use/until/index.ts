import { isDeepSignal, isSignal, onMount, toValue, watch } from "@sigrea/core";
import type {
	Computed,
	DeepSignal,
	ReadonlyDeepSignal,
	ReadonlySignal,
	Signal,
	WatchOptions,
	WatchSource,
	WatchStopHandle,
} from "@sigrea/core";

import { tryOnScopeDispose } from "../tryOnScopeDispose";
import type {
	UntilArrayInstance,
	UntilBaseInstance,
	UntilToMatchOptions,
	UntilValueInstance,
} from "../types";

type WatchableSource =
	| WatchSource<unknown>
	| DeepSignal<object>
	| ReadonlyDeepSignal<object>;
type SourceList = readonly WatchableSource[];
type UntilSourceValue<T> = T extends Signal<infer Value>
	? Value
	: T extends ReadonlySignal<infer Value>
		? Value
		: T extends Computed<infer Value>
			? Value
			: T extends () => infer Value
				? Value
				: T extends DeepSignal<infer Value>
					? Value
					: T extends ReadonlyDeepSignal<infer Value>
						? Value
						: T;
type UntilSourceListValues<T extends readonly unknown[]> = {
	[K in keyof T]: UntilSourceValue<T[K]>;
};

function isWatchableSource(source: unknown): source is WatchableSource {
	return (
		isSignal(source) || isDeepSignal(source) || typeof source === "function"
	);
}

function isWatchableSourceList(source: unknown): source is readonly unknown[] {
	if (!Array.isArray(source)) {
		return false;
	}
	if (isDeepSignal(source)) {
		return false;
	}

	return (source as readonly unknown[]).some(isWatchableSource);
}

function resolveCurrentValue(source: unknown): unknown {
	if (isSignal(source)) {
		return source.value;
	}
	if (typeof source === "function") {
		return (source as () => unknown)();
	}
	if (isWatchableSourceList(source)) {
		return source.map(resolveCurrentValue);
	}
	return source;
}

function toWatchSource(source: unknown): WatchableSource | SourceList {
	if (isWatchableSource(source)) {
		return source;
	}
	if (isWatchableSourceList(source)) {
		return source.map((entry) =>
			isWatchableSource(entry) ? entry : () => entry,
		) as SourceList;
	}
	return () => source;
}

function stopWatcher(stop: WatchStopHandle | undefined): void {
	if (stop !== undefined) {
		stop();
	}
}

function watchOnce<T>(
	source: unknown,
	condition: (value: T) => boolean,
	isNot: boolean,
	options: Required<Pick<UntilToMatchOptions, "deep" | "flush">> &
		UntilToMatchOptions,
	read = () => resolveCurrentValue(source) as T,
	watchSource: WatchableSource | SourceList = toWatchSource(source),
	recheckOnMount = true,
): Promise<T> {
	const initialValue = read();
	if (condition(initialValue) !== isNot) {
		return Promise.resolve(initialValue);
	}

	let settled = false;
	let stop: WatchStopHandle | undefined;
	let timeoutId: ReturnType<typeof setTimeout> | undefined;

	const clearTimeoutIfActive = () => {
		if (timeoutId !== undefined) {
			clearTimeout(timeoutId);
			timeoutId = undefined;
		}
	};

	const cleanup = () => {
		clearTimeoutIfActive();
		stopWatcher(stop);
		stop = undefined;
	};

	return new Promise<T>((resolve, reject) => {
		const settle = (value: T) => {
			if (settled) {
				return;
			}
			settled = true;
			cleanup();
			resolve(value);
		};
		const rejectTimeout = () => {
			if (settled) {
				return;
			}
			settled = true;
			cleanup();
			reject("Timeout");
		};
		const evaluate = (value: T) => {
			if (condition(value) !== isNot) {
				settle(value);
			}
		};
		const startTimeout = () => {
			if (settled || options.timeout === undefined || timeoutId !== undefined) {
				return;
			}
			timeoutId = setTimeout(() => {
				if (options.throwOnTimeout) {
					rejectTimeout();
					return;
				}
				settle(read());
			}, options.timeout);
		};

		tryOnScopeDispose(cleanup);

		const onChange = () => {
			evaluate(read());
		};

		if (Array.isArray(watchSource)) {
			stop = watch(
				watchSource,
				() => {
					onChange();
				},
				{
					deep: options.deep,
					flush: options.flush,
					immediate: false,
				},
			);
		} else {
			stop = watch(
				watchSource as WatchSource<T>,
				() => {
					onChange();
				},
				{
					deep: options.deep,
					flush: options.flush,
					immediate: false,
				},
			);
		}

		let runsOnMount = false;
		try {
			onMount(() => {
				if (recheckOnMount) {
					evaluate(read());
				}
				startTimeout();
				return clearTimeoutIfActive;
			});
			runsOnMount = true;
		} catch {}
		if (!runsOnMount) {
			startTimeout();
		}
	});
}

function createUntil<T>(source: unknown, isNot = false): UntilValueInstance<T> {
	const defaultOptions: Required<Pick<UntilToMatchOptions, "deep" | "flush">> =
		{
			deep: false,
			flush: "sync",
		};

	function toMatch(
		condition: (value: T) => boolean,
		options: UntilToMatchOptions = {},
	): Promise<T> {
		const resolvedOptions = { ...defaultOptions, ...options };
		return watchOnce<T>(source, condition, isNot, resolvedOptions);
	}

	function toBe<P = T>(
		value: P,
		options?: UntilToMatchOptions,
	): Promise<T | P> {
		const expected = value;
		if (!isWatchableSource(expected)) {
			return toMatch((current) => (current as unknown) === expected, options);
		}

		const resolvedOptions = { ...defaultOptions, ...options };
		return watchOnce<T | P>(
			source,
			(current) => (current as unknown) === resolveCurrentValue(expected),
			isNot,
			resolvedOptions,
			() => resolveCurrentValue(source) as T,
			[() => resolveCurrentValue(source), () => resolveCurrentValue(expected)],
		);
	}

	function toBeTruthy(options?: UntilToMatchOptions) {
		return toMatch((value) => Boolean(value), options);
	}

	function toBeNull(options?: UntilToMatchOptions) {
		return toBe(null, options);
	}

	function toBeUndefined(options?: UntilToMatchOptions) {
		return toBe(undefined, options);
	}

	function toBeNaN(options?: UntilToMatchOptions) {
		return toMatch(Number.isNaN, options);
	}

	function changed(options?: UntilToMatchOptions) {
		return changedTimes(1, options);
	}

	function changedTimes(count = 1, options?: UntilToMatchOptions) {
		let seenChanges = -1;
		const resolvedOptions = { ...defaultOptions, ...options };
		return watchOnce<T>(
			source,
			() => {
				seenChanges += 1;
				return seenChanges >= count;
			},
			isNot,
			resolvedOptions,
			() => resolveCurrentValue(source) as T,
			toWatchSource(source),
			false,
		);
	}

	function toContains(value: unknown, options?: UntilToMatchOptions) {
		return toMatch((current) => {
			const array = Array.from(current as Iterable<unknown>);
			const expected = toValue(value);
			return array.includes(value) || array.includes(expected);
		}, options);
	}

	const base: UntilBaseInstance<T> = {
		toMatch: toMatch as UntilBaseInstance<T>["toMatch"],
		changed,
		changedTimes,
	};

	if (Array.isArray(resolveCurrentValue(source))) {
		const arrayBase = base as unknown as UntilBaseInstance<
			T & readonly unknown[]
		>;
		const arrayInstance: UntilArrayInstance<T & readonly unknown[]> = {
			...arrayBase,
			toContains: toContains as UntilArrayInstance<
				T & readonly unknown[]
			>["toContains"],
			get not() {
				return createUntil<T & readonly unknown[]>(
					source,
					!isNot,
				) as unknown as UntilArrayInstance<T & readonly unknown[]>;
			},
		};
		return arrayInstance as unknown as UntilValueInstance<T>;
	}

	return {
		...base,
		toBe: toBe as UntilValueInstance<T>["toBe"],
		toBeTruthy: toBeTruthy as UntilValueInstance<T>["toBeTruthy"],
		toBeNull: toBeNull as UntilValueInstance<T>["toBeNull"],
		toBeUndefined: toBeUndefined as UntilValueInstance<T>["toBeUndefined"],
		toBeNaN,
		get not() {
			return createUntil<T>(source, !isNot) as unknown as UntilValueInstance<
				T,
				true
			>;
		},
	};
}

/**
 * Promised one-time watch for changes.
 *
 * @param source Source to watch until a condition matches.
 */
export function until<T extends readonly unknown[]>(
	source: readonly [...T],
): UntilArrayInstance<UntilSourceListValues<T>>;
export function until<T extends readonly unknown[]>(
	source: T,
): UntilArrayInstance<T>;
export function until<T extends readonly unknown[]>(
	source: WatchSource<T>,
): UntilArrayInstance<T>;
export function until<T>(source: WatchSource<T> | T): UntilValueInstance<T>;
export function until<T>(
	source: WatchSource<T> | T,
): UntilValueInstance<T> | UntilArrayInstance<readonly unknown[]> {
	return createUntil<T>(source);
}
