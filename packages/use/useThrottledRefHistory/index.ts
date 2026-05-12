import type { Signal } from "@sigrea/core";

import { resolveValue } from "../../shared/resolveValue";
import { bindTimerCleanup } from "../internal";
import type {
	UseRefHistoryOptions,
	UseThrottledRefHistoryOptions,
	UseThrottledRefHistoryReturn,
} from "../types";
import { useRefHistory } from "../useRefHistory";

interface ThrottledUseRefHistoryOptions<Raw, Serialized>
	extends UseRefHistoryOptions<Raw, Serialized> {
	scheduleCommit?: (commit: () => void) => void;
}

export function useThrottledRefHistory<Raw, Serialized = Raw>(
	source: Signal<Raw>,
	options: UseThrottledRefHistoryOptions<Raw, Serialized> = {},
): UseThrottledRefHistoryReturn<Raw, Serialized> {
	const { throttle = 200, trailing = true, ...historyOptions } = options;
	let disposed = false;
	let hasLastExec = false;
	let lastExec = 0;
	let timer: ReturnType<typeof setTimeout> | undefined;
	let pendingCommit: (() => void) | undefined;

	function clearTimer(): void {
		if (timer !== undefined) {
			clearTimeout(timer);
			timer = undefined;
		}
		pendingCommit = undefined;
	}

	function runCommit(commit: () => void): void {
		if (disposed) {
			return;
		}

		hasLastExec = true;
		lastExec = Date.now();
		commit();
	}

	function runPendingCommit(): void {
		const commit = pendingCommit;
		timer = undefined;
		pendingCommit = undefined;

		if (commit !== undefined) {
			runCommit(commit);
		}
	}

	function scheduleCommit(commit: () => void): void {
		clearTimer();
		if (disposed) {
			return;
		}

		const duration = resolveValue(throttle);
		if (duration <= 0) {
			runCommit(commit);
			return;
		}

		const now = Date.now();
		const elapsed = hasLastExec ? now - lastExec : duration;
		if (elapsed >= duration) {
			runCommit(commit);
			return;
		}

		if (!trailing) {
			return;
		}

		pendingCommit = commit;
		timer = setTimeout(runPendingCommit, Math.max(0, duration - elapsed));
	}

	const refHistoryOptions: ThrottledUseRefHistoryOptions<Raw, Serialized> = {
		...historyOptions,
		scheduleCommit,
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
		resumeHistory(commitNow);
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
