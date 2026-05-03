import {
	deepSignal,
	getCurrentScope,
	isDeepSignal,
	onDispose,
	readonly,
	signal,
	toRawDeepSignal,
	watch,
} from "@sigrea/core";
import type { Signal } from "@sigrea/core";

import type {
	CloneFn,
	UseRefHistoryOptions,
	UseRefHistoryReturn,
} from "../types";
import { useManualRefHistory } from "../useManualRefHistory";

interface IgnoredWatchValue<Raw> {
	value?: Raw;
	updateLastRawValue: boolean;
	matchValue: boolean;
}

type Mapper<From, To> = (value: From) => To;

function bypass<From, To>(value: From): To {
	return value as unknown as To;
}

function cloneJson<T>(value: T): T {
	return JSON.parse(JSON.stringify(value)) as T;
}

function createDefaultDump<Raw, Serialized>(
	clone?: boolean | CloneFn<Raw>,
): Mapper<Raw, Serialized> {
	if (typeof clone === "function") {
		return clone as unknown as Mapper<Raw, Serialized>;
	}
	if (clone) {
		return cloneJson as unknown as Mapper<Raw, Serialized>;
	}
	return bypass;
}

function createDefaultParse<Raw, Serialized>(
	clone?: boolean | CloneFn<Raw>,
): Mapper<Serialized, Raw> {
	if (typeof clone === "function") {
		return clone as unknown as Mapper<Serialized, Raw>;
	}
	if (clone) {
		return cloneJson as unknown as Mapper<Serialized, Raw>;
	}
	return bypass;
}

function isObjectValue(value: unknown): value is object {
	return typeof value === "object" && value !== null;
}

function toDeepSourceValue<Raw>(value: Raw): Raw {
	if (!isObjectValue(value)) {
		return value;
	}
	if (isDeepSignal(value)) {
		return value;
	}
	return deepSignal(toRawDeepSignal(value)) as Raw;
}

function toHistoryValue<Raw>(value: Raw): Raw {
	if (!isObjectValue(value)) {
		return value;
	}
	return toRawDeepSignal(value) as Raw;
}

export function useRefHistory<Raw, Serialized = Raw>(
	source: Signal<Raw>,
	options: UseRefHistoryOptions<Raw, Serialized> = {},
): UseRefHistoryReturn<Raw, Serialized> {
	const {
		deep = false,
		flush = "pre",
		shouldCommit = () => true,
		...manualOptions
	} = options;
	const isTrackingSource = signal(true);
	const ignoredWatchValues: IgnoredWatchValue<Raw>[] = [];
	let disposed = false;
	if (deep) {
		const sourceValue = toDeepSourceValue(source.value);
		if (!Object.is(source.peek(), sourceValue)) {
			source.value = sourceValue;
		}
	}
	let lastRawValue: Raw | undefined = source.value;
	let pausedChanged = false;
	let pausedSourceValue: Raw | undefined;
	let pendingWatch = false;

	function queueIgnoredWatchValue(
		value: Raw,
		updateLastRawValue: boolean,
		matchValue = true,
	): void {
		ignoredWatchValues.push({ matchValue, updateLastRawValue, value });
	}

	function takeIgnoredWatchValue(
		value: Raw,
	): IgnoredWatchValue<Raw> | undefined {
		const index = ignoredWatchValues.findIndex(
			(entry) => !entry.matchValue || Object.is(entry.value, value),
		);
		if (index === -1) {
			ignoredWatchValues.length = 0;
			return undefined;
		}

		const ignored = ignoredWatchValues[index];
		ignoredWatchValues.length = 0;
		return ignored;
	}

	function setSource(nextSource: Signal<Raw>, value: Raw): void {
		const sourceValue = deep ? toDeepSourceValue(value) : value;
		if (!Object.is(nextSource.peek(), sourceValue)) {
			queueIgnoredWatchValue(sourceValue, true);
		}
		nextSource.value = sourceValue;
	}

	function ensureDeepSourceValue(value: Raw): Raw {
		if (!deep) {
			return value;
		}

		const sourceValue = toDeepSourceValue(value);
		if (!Object.is(value, sourceValue)) {
			queueIgnoredWatchValue(sourceValue, false);
			source.value = sourceValue;
		}
		return sourceValue;
	}

	const clone = manualOptions.clone || deep;
	const dump = manualOptions.dump ?? createDefaultDump<Raw, Serialized>(clone);
	const parse =
		manualOptions.parse ?? createDefaultParse<Raw, Serialized>(clone);

	const manualHistory = useManualRefHistory(source, {
		...manualOptions,
		clone,
		dump: deep ? (value) => dump(toHistoryValue(value)) : manualOptions.dump,
		parse: deep
			? (value) => toDeepSourceValue(parse(value))
			: manualOptions.parse,
		setSource,
	});
	const { clear, commit: commitManually } = manualHistory;

	function commit(): void {
		if (disposed) {
			return;
		}

		const nextValue = ensureDeepSourceValue(source.value);
		if (pendingWatch || flush !== "sync") {
			queueIgnoredWatchValue(nextValue, false);
			pendingWatch = false;
		}

		if (!shouldCommit(lastRawValue, nextValue)) {
			return;
		}

		lastRawValue = nextValue;
		commitManually();
	}

	const watchHandle = watch(
		source,
		(nextValue) => {
			pendingWatch = false;

			const ignored = takeIgnoredWatchValue(nextValue);
			if (ignored !== undefined) {
				if (ignored.updateLastRawValue) {
					lastRawValue = nextValue;
				}
				return;
			}

			const sourceValue = ensureDeepSourceValue(nextValue);

			if (!isTrackingSource.value) {
				pausedChanged = false;
				return;
			}

			if (!deep && Object.is(lastRawValue, sourceValue)) {
				return;
			}

			if (!shouldCommit(lastRawValue, sourceValue)) {
				return;
			}

			lastRawValue = sourceValue;
			commitManually();
		},
		{
			deep,
			flush,
			onTrigger: () => {
				if (disposed) {
					return;
				}
				if (!isTrackingSource.value) {
					pausedChanged = true;
				}
				if (flush !== "sync") {
					pendingWatch = true;
				}
			},
		},
	);

	function pause(): void {
		if (disposed || !isTrackingSource.value) {
			return;
		}
		pausedSourceValue = source.peek();
		isTrackingSource.value = false;
	}

	function resume(commitNow = false): void {
		if (disposed) {
			return;
		}

		const wasPaused = !isTrackingSource.value;
		const sourceValue = source.peek();
		if (
			wasPaused &&
			flush !== "sync" &&
			(pausedChanged || !Object.is(pausedSourceValue, sourceValue))
		) {
			queueIgnoredWatchValue(source.value, false);
			pausedChanged = false;
		}
		pausedSourceValue = undefined;

		if (!isTrackingSource.value) {
			isTrackingSource.value = true;
		}

		if (commitNow) {
			commit();
		}
	}

	function batch(fn: (cancel: () => void) => void): void {
		let canceled = false;
		let thrown = false;
		const wasTracking = isTrackingSource.value;

		pause();

		try {
			fn(() => {
				canceled = true;
			});
		} catch (error) {
			thrown = true;
			throw error;
		} finally {
			try {
				if (!thrown && !canceled) {
					commit();
				}
			} finally {
				if (wasTracking) {
					resume();
				}
			}
		}
	}

	function dispose(): void {
		if (disposed) {
			return;
		}
		disposed = true;
		watchHandle();
		isTrackingSource.value = false;
		ignoredWatchValues.length = 0;
		pausedChanged = false;
		pendingWatch = false;
		clear();
	}

	const scope = getCurrentScope();
	if (scope !== undefined) {
		onDispose(dispose, scope);
	}

	return {
		...manualHistory,
		isTracking: readonly(isTrackingSource),
		pause,
		resume,
		commit,
		batch,
		dispose,
	};
}
