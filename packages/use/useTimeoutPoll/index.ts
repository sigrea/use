import { readonly, signal } from "@sigrea/core";

import { bindAutoStart } from "../internal";
import type {
	MaybeValue,
	UseTimeoutPollCallback,
	UseTimeoutPollOptions,
	UseTimeoutPollReturn,
} from "../types";
import { useTimeoutFn } from "../useTimeoutFn";

export function useTimeoutPoll(
	callback: UseTimeoutPollCallback,
	interval: MaybeValue<number>,
	options: UseTimeoutPollOptions = {},
): UseTimeoutPollReturn {
	const isActive = signal(false);
	let runId = 0;

	const loop = async (currentRunId: number) => {
		if (!isActive.value || runId !== currentRunId) {
			return;
		}

		await callback();

		if (!isActive.value || runId !== currentRunId) {
			return;
		}

		timer.start(currentRunId);
	};

	const timer = useTimeoutFn(loop, interval, { immediate: false });

	const pause = () => {
		runId += 1;
		isActive.value = false;
		timer.stop();
	};

	const resume = () => {
		if (isActive.value) {
			return;
		}

		runId += 1;
		const currentRunId = runId;
		isActive.value = true;

		if (options.immediateCallback) {
			void loop(currentRunId);
			return;
		}

		timer.start(currentRunId);
	};

	bindAutoStart(resume, pause, options.immediate ?? true);

	return {
		isActive: readonly(isActive),
		pause,
		resume,
	};
}
