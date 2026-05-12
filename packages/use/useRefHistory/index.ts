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

interface UseRefHistoryInternalOptions<Raw, Serialized>
	extends UseRefHistoryOptions<Raw, Serialized> {
	scheduleCommit?: (commit: () => void) => void;
}

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
	const internalOptions = options as UseRefHistoryInternalOptions<
		Raw,
		Serialized
	>;
	const {
		deep = false,
		flush = "pre",
		scheduleCommit,
		shouldCommit = () => true,
		...manualOptions
	} = internalOptions;
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
	let lastWatchValue: Raw | undefined = lastRawValue;
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

	function queuePendingIgnoredWatchValue(value: Raw): void {
		if (
			!pendingWatch &&
			(flush === "sync" || Object.is(lastWatchValue, value))
		) {
			return;
		}

		queueIgnoredWatchValue(value, false);
		lastWatchValue = value;
		pendingWatch = false;
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
		queuePendingIgnoredWatchValue(nextValue);

		commitSourceValue(nextValue);
	}

	function commitSourceValue(nextValue: Raw): void {
		if (disposed) {
			return;
		}

		const sourceValue = ensureDeepSourceValue(nextValue);

		if (!shouldCommit(lastRawValue, sourceValue)) {
			return;
		}

		lastRawValue = sourceValue;
		commitManually();
	}

	function commitSourceChange(nextValue: Raw): void {
		const sourceValue = ensureDeepSourceValue(nextValue);

		if (!deep && Object.is(lastRawValue, sourceValue)) {
			return;
		}

		commitSourceValue(sourceValue);
	}

	const watchHandle = watch(
		source,
		(nextValue) => {
			pendingWatch = false;
			lastWatchValue = nextValue;

			const ignored = takeIgnoredWatchValue(nextValue);
			if (ignored !== undefined) {
				const sourceValue = ensureDeepSourceValue(nextValue);
				lastWatchValue = sourceValue;
				if (ignored.updateLastRawValue) {
					lastRawValue = sourceValue;
				}
				return;
			}

			const sourceValue = ensureDeepSourceValue(nextValue);
			lastWatchValue = sourceValue;

			if (!isTrackingSource.value) {
				return;
			}

			if (scheduleCommit !== undefined) {
				scheduleCommit(() => {
					commitSourceChange(source.value);
				});
				return;
			}

			commitSourceChange(sourceValue);
		},
		{
			deep,
			flush,
			onTrigger: () => {
				if (disposed) {
					return;
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
		isTrackingSource.value = false;
	}

	function resume(commitNow = false): void {
		if (disposed) {
			return;
		}

		const wasPaused = !isTrackingSource.value;
		if (wasPaused) {
			const sourceValue = source.value;
			queuePendingIgnoredWatchValue(sourceValue);
		}

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
