import { computed, readonly, signal, watch } from "@sigrea/core";

import { resolveValue } from "../../shared/resolveValue";
import { bindTimerCleanup } from "../internal";
import type { MaybeValue, SignalThrottledReturn } from "../types";
import { useThrottleFn } from "../useThrottleFn";

export function signalThrottled<T>(
	value: MaybeValue<T>,
	ms: MaybeValue<number> = 200,
	trailing = true,
	leading = true,
): SignalThrottledReturn<T> {
	let isInitialRun = true;
	let hasPendingUpdate = false;
	let pendingUpdateId = 0;
	const source = computed(() => resolveValue(value));
	const throttled = signal(source.value);
	const updater = useThrottleFn(
		(nextValue: T) => {
			throttled.value = nextValue;
		},
		ms,
		trailing,
		leading,
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
				if (Object.is(nextValue, throttled.peek())) {
					return;
				}
			}

			if (!hasPendingUpdate && Object.is(nextValue, throttled.peek())) {
				return;
			}

			scheduleUpdate(nextValue);
		},
		{ flush: "sync", immediate: true },
	);

	return readonly(throttled);
}
