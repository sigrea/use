import type { Signal } from "@sigrea/core";

import { resolveValue } from "../../shared/resolveValue";
import { bindTimerCleanup } from "../internal";
import type {
	UseDebouncedRefHistoryOptions,
	UseDebouncedRefHistoryReturn,
	UseRefHistoryOptions,
} from "../types";
import { useRefHistory } from "../useRefHistory";

interface DebouncedUseRefHistoryOptions<Raw, Serialized>
	extends UseRefHistoryOptions<Raw, Serialized> {
	scheduleCommit?: (commit: () => void) => void;
}

export function useDebouncedRefHistory<Raw, Serialized = Raw>(
	source: Signal<Raw>,
	options: UseDebouncedRefHistoryOptions<Raw, Serialized> = {},
): UseDebouncedRefHistoryReturn<Raw, Serialized> {
	const { debounce, shouldCommit = () => true, ...historyOptions } = options;

	if (debounce === undefined) {
		return useRefHistory(source, { ...historyOptions, shouldCommit });
	}

	const debounceDelay = debounce;
	let timer: ReturnType<typeof setTimeout> | undefined;
	let disposed = false;

	function clearTimer(): void {
		if (timer !== undefined) {
			clearTimeout(timer);
			timer = undefined;
		}
	}

	function runDebouncedCommit(commit: () => void): void {
		timer = undefined;
		if (disposed) {
			return;
		}

		commit();
	}

	function scheduleCommit(commit: () => void): void {
		clearTimer();

		const duration = resolveValue(debounceDelay);
		if (duration <= 0) {
			runDebouncedCommit(commit);
			return;
		}

		timer = setTimeout(() => {
			runDebouncedCommit(commit);
		}, duration);
	}

	const refHistoryOptions: DebouncedUseRefHistoryOptions<Raw, Serialized> = {
		...historyOptions,
		scheduleCommit,
		shouldCommit,
	};
	const history = useRefHistory(source, refHistoryOptions);

	const {
		batch: commitBatch,
		clear: clearHistory,
		commit: commitNow,
		dispose: disposeHistory,
		pause: pauseHistory,
		redo: redoHistory,
		resume: resumeHistory,
		reset: resetHistory,
		undo: undoHistory,
	} = history;

	function commit(): void {
		clearTimer();
		commitNow();
	}

	function batch(fn: (cancel: () => void) => void): void {
		clearTimer();
		commitBatch(fn);
	}

	function pause(): void {
		clearTimer();
		pauseHistory();
	}

	function resume(commitNow = false): void {
		clearTimer();
		if (commitNow) {
			resumeHistory(true);
			return;
		}
		resumeHistory(false);
	}

	function clear(): void {
		clearTimer();
		clearHistory();
	}

	function reset(): void {
		clearTimer();
		resetHistory();
	}

	function undo(): void {
		clearTimer();
		undoHistory();
	}

	function redo(): void {
		clearTimer();
		redoHistory();
	}

	function dispose(): void {
		if (disposed) {
			return;
		}
		disposed = true;
		clearTimer();
		disposeHistory();
	}

	bindTimerCleanup(clearTimer);

	return {
		...history,
		batch,
		clear,
		commit,
		dispose,
		pause,
		redo,
		resume,
		reset,
		undo,
	};
}
