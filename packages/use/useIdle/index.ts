import { readonly, signal, watch } from "@sigrea/core";

import { defaultWindow, listen, resolveTarget } from "../../shared";
import { bindAutoStart } from "../internal";
import { tryOnScopeDispose } from "../tryOnScopeDispose";
import type {
	MaybeTarget,
	UseIdleEventName,
	UseIdleOptions,
	UseIdleReturn,
	UseIdleWindowLike,
} from "../types";

const oneMinute = 60_000;
const defaultEvents: readonly UseIdleEventName[] = [
	"mousemove",
	"mousedown",
	"resize",
	"keydown",
	"touchstart",
	"wheel",
];

function currentTimestamp(): number {
	return Date.now();
}

function normalizeTimeout(timeout: number): number {
	return Number.isFinite(timeout) && timeout > 0 ? timeout : 0;
}

/**
 * Tracks whether the user has been inactive.
 */
export function useIdle<TWindow extends UseIdleWindowLike = UseIdleWindowLike>(
	timeout = oneMinute,
	options: UseIdleOptions<TWindow> = {},
): UseIdleReturn {
	const windowTarget: MaybeTarget<TWindow | null | undefined> | undefined =
		"window" in options && options.window !== undefined
			? options.window
			: (defaultWindow as TWindow | undefined);
	const events = options.events ?? defaultEvents;
	const initialState = options.initialState ?? false;
	const listenForVisibilityChange = options.listenForVisibilityChange ?? true;
	const idle = signal(initialState);
	const lastActive = signal(currentTimestamp());
	const pending = signal(false);
	let timer: ReturnType<typeof setTimeout> | undefined;
	let cleanups: Array<() => void> = [];
	let shouldTrack = false;

	const currentWindow = () =>
		windowTarget === undefined
			? undefined
			: resolveTarget<TWindow | null | undefined>(windowTarget);
	const clearTimer = () => {
		if (timer !== undefined) {
			clearTimeout(timer);
			timer = undefined;
		}
	};
	const clearListeners = () => {
		for (const cleanup of cleanups) {
			cleanup();
		}
		cleanups = [];
	};
	const scheduleIdle = () => {
		clearTimer();
		if (!pending.value) {
			return;
		}

		timer = setTimeout(() => {
			timer = undefined;
			if (pending.value) {
				idle.value = true;
			}
		}, normalizeTimeout(timeout));
	};
	const reset = () => {
		idle.value = false;
		scheduleIdle();
	};
	const handleActivity = () => {
		if (!pending.value) {
			return;
		}

		lastActive.value = currentTimestamp();
		reset();
	};
	const bindListeners = (window: UseIdleWindowLike) => {
		clearListeners();
		const listenerOptions = { passive: true };
		for (const eventName of events) {
			cleanups.push(listen(window, eventName, handleActivity, listenerOptions));
		}

		const document = window.document;
		if (listenForVisibilityChange && document !== undefined) {
			cleanups.push(
				listen(
					document,
					"visibilitychange",
					() => {
						if (document.hidden === true) {
							return;
						}
						handleActivity();
					},
					listenerOptions,
				),
			);
		}
	};
	const beginTracking = (
		window: UseIdleWindowLike,
		shouldSchedule: boolean,
	) => {
		pending.value = true;
		bindListeners(window);
		if (shouldSchedule) {
			reset();
		}
	};
	const start = () => {
		shouldTrack = true;
		if (pending.value) {
			return;
		}

		const window = currentWindow();
		if (window === undefined || window === null) {
			return;
		}

		beginTracking(window, !initialState);
	};
	const stop = () => {
		shouldTrack = false;
		clearTimer();
		clearListeners();
		pending.value = false;
		idle.value = initialState;
	};

	const stopWindowWatch = watch(
		() => currentWindow(),
		(nextWindow, previousWindow) => {
			if (previousWindow === nextWindow) {
				return;
			}

			const wasPending = pending.value;
			const shouldSchedule =
				wasPending && (timer !== undefined || idle.value === false);
			clearTimer();
			clearListeners();
			pending.value = false;
			if (!shouldTrack || nextWindow === undefined || nextWindow === null) {
				return;
			}
			beginTracking(
				nextWindow,
				wasPending ? shouldSchedule : !initialState || idle.value === false,
			);
		},
		{ immediate: true, flush: "sync" },
	);
	const cleanup = () => {
		stop();
		stopWindowWatch();
	};

	bindAutoStart(start, stop, options.immediate ?? true);
	tryOnScopeDispose(cleanup);

	return {
		idle: readonly(idle),
		lastActive: readonly(lastActive),
		isPending: readonly(pending),
		reset,
		start,
		stop,
	};
}
