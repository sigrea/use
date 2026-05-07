import { type ReadonlySignal, readonly, signal } from "@sigrea/core";

import { resolveValue } from "../../shared";
import type {
	MaybeValue,
	UseTimestampOptions,
	UseTimestampReturn,
} from "../types";
import { useIntervalFn } from "../useIntervalFn";
import { useRafFn } from "../useRafFn";

export function useTimestamp(
	options?: UseTimestampOptions<false>,
): ReadonlySignal<number>;
export function useTimestamp(
	options: UseTimestampOptions<true>,
): UseTimestampReturn<true>;
export function useTimestamp(
	options: UseTimestampOptions<boolean> = {},
): UseTimestampReturn<boolean> {
	const {
		controls: exposeControls = false,
		offset = 0,
		immediate = true,
		scheduler,
		callback,
	} = options;
	const currentTimestamp = () => Date.now() + resolveValue(offset);
	const timestamp = signal(currentTimestamp());
	const update = () => {
		timestamp.value = currentTimestamp();
		callback?.(timestamp.value);
	};
	const createScheduler =
		scheduler ??
		((updateCallback: () => void) => {
			const interval = resolveValue(
				options.interval ?? "requestAnimationFrame",
			);

			return interval === "requestAnimationFrame"
				? useRafFn(updateCallback, { immediate })
				: useIntervalFn(
						updateCallback,
						options.interval as MaybeValue<number>,
						{ immediate },
					);
		});
	const controls = createScheduler(update);
	const readonlyTimestamp = readonly(timestamp);

	if (exposeControls) {
		return {
			timestamp: readonlyTimestamp,
			...controls,
		} as UseTimestampReturn<boolean>;
	}

	return readonlyTimestamp as UseTimestampReturn<boolean>;
}
