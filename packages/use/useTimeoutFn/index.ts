import { readonly, signal } from "@sigrea/core";
import { resolveValue } from "../../shared/resolveValue";

import { bindAutoStart } from "../internal";

import type {
	MaybeValue,
	UseTimeoutFnOptions,
	UseTimeoutFnReturn,
} from "../types";

type ManualUseTimeoutFnOptions = UseTimeoutFnOptions & { immediate: false };
type AutoUseTimeoutFnCallback<TArgs extends unknown[]> = [] extends TArgs
	? (...args: TArgs) => void
	: never;

export function useTimeoutFn<TArgs extends unknown[] = []>(
	callback: AutoUseTimeoutFnCallback<TArgs>,
	delay: MaybeValue<number>,
	options?: UseTimeoutFnOptions,
): UseTimeoutFnReturn<TArgs>;
export function useTimeoutFn<TArgs extends unknown[]>(
	callback: (...args: TArgs) => void,
	delay: MaybeValue<number>,
	options: ManualUseTimeoutFnOptions,
): UseTimeoutFnReturn<TArgs>;
export function useTimeoutFn<TArgs extends unknown[] = []>(
	callback: (...args: TArgs) => void,
	delay: MaybeValue<number>,
	options: UseTimeoutFnOptions = {},
): UseTimeoutFnReturn<TArgs> {
	const isPending = signal(false);
	let timer: ReturnType<typeof setTimeout> | undefined;
	let runId = 0;

	const stop = () => {
		runId += 1;
		if (timer !== undefined) {
			clearTimeout(timer);
			timer = undefined;
		}
		isPending.value = false;
	};

	const start = (...args: TArgs) => {
		stop();
		const currentRunId = runId + 1;
		runId = currentRunId;
		isPending.value = true;

		if (options.immediateCallback) {
			callback(...(args as TArgs));
		}

		if (!isPending.value || runId !== currentRunId) {
			return;
		}

		timer = setTimeout(() => {
			if (runId !== currentRunId) {
				return;
			}
			timer = undefined;
			isPending.value = false;
			callback(...(args as TArgs));
		}, resolveValue(delay));
	};

	bindAutoStart(
		() => {
			start(...([] as unknown as TArgs));
		},
		stop,
		options.immediate ?? true,
	);

	return {
		isPending: readonly(isPending),
		start,
		stop,
	};
}
