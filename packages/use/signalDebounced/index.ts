import { computed, readonly, signal, watch } from "@sigrea/core";

import { resolveValue } from "../../shared/resolveValue";
import { bindTimerCleanup } from "../internal";
import type {
	MaybeValue,
	SignalDebouncedOptions,
	SignalDebouncedReturn,
} from "../types";
import { useDebounceFn } from "../useDebounceFn";

export function signalDebounced<T>(
	value: MaybeValue<T>,
	ms: MaybeValue<number> = 200,
	options: SignalDebouncedOptions = {},
): SignalDebouncedReturn<T> {
	let isInitialRun = true;
	let hasPendingUpdate = false;
	let pendingUpdateId = 0;
	const debounceOptions = { ...options };
	(
		debounceOptions as SignalDebouncedOptions & { rejectOnCancel?: unknown }
	).rejectOnCancel = undefined;
	const source = computed(() => resolveValue(value));
	const debounced = signal(source.value);
	const updater = useDebounceFn(
		(nextValue: T) => {
			debounced.value = nextValue;
		},
		ms,
		debounceOptions,
	);
	const resetPendingUpdate = () => {
		pendingUpdateId += 1;
		hasPendingUpdate = false;
	};
	const scheduleUpdate = (nextValue: T) => {
		const currentUpdateId = pendingUpdateId + 1;
		pendingUpdateId = currentUpdateId;
		hasPendingUpdate = true;
		const clearPendingUpdate = () => {
			if (pendingUpdateId === currentUpdateId) {
				hasPendingUpdate = false;
			}
		};

		updater(nextValue).then(clearPendingUpdate, clearPendingUpdate);
	};

	bindTimerCleanup(resetPendingUpdate);

	watch(
		source,
		(nextValue) => {
			if (isInitialRun) {
				isInitialRun = false;
				if (Object.is(nextValue, debounced.peek())) {
					return;
				}
			}

			if (!hasPendingUpdate && Object.is(nextValue, debounced.peek())) {
				return;
			}

			scheduleUpdate(nextValue);
		},
		{ flush: "sync", immediate: true },
	);

	return readonly(debounced);
}
