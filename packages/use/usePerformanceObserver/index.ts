import { readonly, signal, watch } from "@sigrea/core";

import { defaultWindow, resolveTarget } from "../../shared";
import { tryOnScopeDispose } from "../tryOnScopeDispose";
import type {
	MaybeTarget,
	UsePerformanceObserverOptions,
	UsePerformanceObserverReturn,
	UsePerformanceObserverWindowLike,
} from "../types";

function getPerformanceObserver(
	windowTarget: UsePerformanceObserverWindowLike | null | undefined,
): typeof PerformanceObserver | undefined {
	return windowTarget?.PerformanceObserver;
}

export function usePerformanceObserver<
	TWindow extends
		UsePerformanceObserverWindowLike = UsePerformanceObserverWindowLike,
>(
	options: UsePerformanceObserverOptions<TWindow>,
	callback: PerformanceObserverCallback,
): UsePerformanceObserverReturn {
	const { immediate = true, window: _window, ...observerOptions } = options;
	const performanceOptions = observerOptions as PerformanceObserverInit;
	const useDefaultWindow =
		!("window" in options) || options.window === undefined;
	const windowTarget = useDefaultWindow
		? (defaultWindow as MaybeTarget<TWindow> | undefined)
		: options.window;
	const isSupported = signal(false);
	const isActive = signal(immediate);
	const restartCount = signal(0);
	let observer: PerformanceObserver | undefined;
	let cleanupObserver = () => {};
	let stopWatch: () => void = () => {};

	const currentWindow = () =>
		windowTarget === undefined
			? undefined
			: resolveTarget<TWindow | null | undefined>(windowTarget);
	const cleanup = () => {
		cleanupObserver();
		cleanupObserver = () => {};
		observer = undefined;
	};
	const start = () => {
		cleanup();
		if (isActive.value) {
			restartCount.value += 1;
			return;
		}

		isActive.value = true;
	};
	const stop = () => {
		cleanup();
		isActive.value = false;
	};

	stopWatch = watch(
		() => ({
			active: isActive.value,
			restartCount: restartCount.value,
			window: currentWindow(),
		}),
		({ active, window }, _previousValue, onCleanup) => {
			cleanup();
			const PerformanceObserverCtor = getPerformanceObserver(window);
			isSupported.value = typeof PerformanceObserverCtor === "function";

			if (!active || typeof PerformanceObserverCtor !== "function") {
				return;
			}

			let current = true;
			const nextObserver = new PerformanceObserverCtor((list, observer) => {
				if (!current || !isActive.value) {
					return;
				}

				callback(list, observer);
			});
			nextObserver.observe(performanceOptions);
			observer = nextObserver;
			cleanupObserver = () => {
				if (!current) {
					return;
				}

				current = false;
				nextObserver.disconnect();
			};

			onCleanup(cleanup);
		},
		{ immediate: true, flush: "sync" },
	);

	tryOnScopeDispose(() => {
		stopWatch();
		stop();
	});

	return {
		isSupported: readonly(isSupported),
		start,
		stop,
	};
}
