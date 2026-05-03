import { readonly, signal } from "@sigrea/core";
import { resolveValue } from "../shared/resolveValue";

import { bindAutoStart } from "./internal";

import type {
	MaybeValue,
	UseTimeoutFnOptions,
	UseTimeoutFnReturn,
} from "./types";

export function useTimeoutFn(
	callback: () => void,
	delay: MaybeValue<number>,
	options: UseTimeoutFnOptions = {},
): UseTimeoutFnReturn {
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

	const start = () => {
		stop();
		const currentRunId = runId + 1;
		runId = currentRunId;
		isPending.value = true;

		if (options.immediateCallback) {
			callback();
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
			callback();
		}, resolveValue(delay));
	};

	bindAutoStart(start, stop, options.immediate ?? false);

	return {
		isPending: readonly(isPending),
		start,
		stop,
	};
}
