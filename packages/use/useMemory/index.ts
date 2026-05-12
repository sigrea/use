import { readonly, signal, watch } from "@sigrea/core";

import { defaultWindow, resolveTarget } from "../../shared";
import { tryOnScopeDispose } from "../tryOnScopeDispose";
import type {
	MaybeTarget,
	UseMemoryInfo,
	UseMemoryOptions,
	UseMemoryReturn,
	UseMemoryWindowLike,
} from "../types";
import { useIntervalFn } from "../useIntervalFn";

const defaultInterval = 1000;

function snapshotMemory(memory: UseMemoryInfo): UseMemoryInfo {
	return {
		jsHeapSizeLimit: memory.jsHeapSizeLimit,
		totalJSHeapSize: memory.totalJSHeapSize,
		usedJSHeapSize: memory.usedJSHeapSize,
	};
}

export function useMemory<
	TWindow extends UseMemoryWindowLike = UseMemoryWindowLike,
>(options: UseMemoryOptions<TWindow> = {}): UseMemoryReturn {
	const useDefaultWindow =
		!("window" in options) || options.window === undefined;
	const windowTarget = useDefaultWindow
		? (defaultWindow as MaybeTarget<TWindow> | undefined)
		: options.window;
	const isSupported = signal(false);
	const memory = signal<UseMemoryInfo | undefined>();
	let wantsActive = options.immediate ?? true;
	let stopped = false;

	const currentWindow = () =>
		windowTarget === undefined ? undefined : resolveTarget(windowTarget);
	const currentPerformance = () =>
		currentWindow()?.performance ??
		(useDefaultWindow
			? (globalThis.performance as
					| UseMemoryWindowLike["performance"]
					| undefined)
			: undefined);
	const readMemory = () => currentPerformance()?.memory;
	const update = () => {
		const nextMemory = readMemory();
		if (nextMemory === undefined) {
			isSupported.value = false;
			memory.value = undefined;
			controls.pause();
			return;
		}

		isSupported.value = true;
		memory.value = snapshotMemory(nextMemory);
	};
	const controls = useIntervalFn(update, options.interval ?? defaultInterval, {
		immediate: false,
		immediateCallback: options.immediateCallback,
	});

	function resume(): void {
		if (stopped) {
			return;
		}

		wantsActive = true;
		if (readMemory() === undefined) {
			isSupported.value = false;
			memory.value = undefined;
			controls.pause();
			return;
		}

		isSupported.value = true;
		controls.resume();
	}

	function pause(): void {
		wantsActive = false;
		controls.pause();
	}

	const stopWindowWatch = watch(
		() => currentWindow(),
		() => {
			if (readMemory() === undefined) {
				isSupported.value = false;
				memory.value = undefined;
				controls.pause();
				return;
			}

			isSupported.value = true;
			memory.value = undefined;
			if (wantsActive) {
				resume();
			}
		},
		{ immediate: true, flush: "sync" },
	);

	function stop(): void {
		if (stopped) {
			return;
		}

		stopped = true;
		stopWindowWatch();
		controls.pause();
	}

	tryOnScopeDispose(stop);

	return {
		isSupported: readonly(isSupported),
		memory: readonly(memory),
		isActive: controls.isActive,
		pause,
		resume,
		stop,
	};
}
