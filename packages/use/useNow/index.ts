import { type ReadonlySignal, readonly, signal } from "@sigrea/core";

import { defaultWindow, resolveTarget, resolveValue } from "../../shared";
import { bindAutoStart } from "../internal";
import type {
	MaybeTarget,
	UseIntervalFnReturn,
	UseNowOptions,
	UseNowReturn,
	UseNowWindowLike,
} from "../types";
import { useIntervalFn } from "../useIntervalFn";

function getRequestAnimationFrame(
	windowTarget: UseNowWindowLike | undefined,
	allowGlobalFallback: boolean,
): UseNowWindowLike["requestAnimationFrame"] | undefined {
	return (
		windowTarget?.requestAnimationFrame ??
		(allowGlobalFallback ? globalThis.requestAnimationFrame : undefined)
	);
}

function getCancelAnimationFrame(
	windowTarget: UseNowWindowLike | undefined,
	allowGlobalFallback: boolean,
): UseNowWindowLike["cancelAnimationFrame"] | undefined {
	return (
		windowTarget?.cancelAnimationFrame ??
		(allowGlobalFallback ? globalThis.cancelAnimationFrame : undefined)
	);
}

function createRafScheduler(
	callback: () => void,
	getWindow: () => UseNowWindowLike | undefined,
	allowGlobalFallback: boolean,
	immediate: boolean,
): UseIntervalFnReturn {
	const active = signal(false);
	let frameHandle: number | undefined;
	let frameWindow: UseNowWindowLike | undefined;

	const clearFrame = () => {
		if (frameHandle === undefined) {
			return;
		}

		const cancelFrame = getCancelAnimationFrame(
			frameWindow,
			allowGlobalFallback,
		);
		if (typeof cancelFrame === "function") {
			cancelFrame.call(frameWindow ?? globalThis, frameHandle);
		}
		frameHandle = undefined;
		frameWindow = undefined;
	};

	const scheduleFrame = () => {
		if (!active.value || frameHandle !== undefined) {
			return;
		}

		const windowValue = getWindow();
		const requestFrame = getRequestAnimationFrame(
			windowValue,
			allowGlobalFallback,
		);
		if (typeof requestFrame !== "function") {
			active.value = false;
			return;
		}

		frameWindow = windowValue;
		frameHandle = requestFrame.call(windowValue ?? globalThis, () => {
			frameHandle = undefined;
			frameWindow = undefined;

			if (!active.value) {
				return;
			}

			callback();
			scheduleFrame();
		});
	};

	const pause = () => {
		active.value = false;
		clearFrame();
	};

	const resume = () => {
		if (active.value) {
			return;
		}

		active.value = true;
		scheduleFrame();
	};

	bindAutoStart(resume, pause, immediate);

	return {
		isActive: readonly(active),
		pause,
		resume,
	};
}

export function useNow(options?: UseNowOptions<false>): ReadonlySignal<Date>;
export function useNow(options: UseNowOptions<true>): UseNowReturn<true>;
export function useNow(
	options: UseNowOptions<boolean> = {},
): UseNowReturn<boolean> {
	const {
		controls: exposeControls = false,
		immediate = true,
		scheduler,
	} = options;
	const hasWindowOption = "window" in options && options.window !== undefined;
	const windowTarget = hasWindowOption
		? options.window
		: (defaultWindow as MaybeTarget<UseNowWindowLike> | undefined);
	const allowGlobalWindowFallback = !hasWindowOption;
	const now = signal(new Date());
	const update = () => {
		now.value = new Date();
	};
	const currentWindow = () =>
		windowTarget === undefined
			? undefined
			: (resolveTarget<UseNowWindowLike | null | undefined>(windowTarget) ??
				undefined);
	const createScheduler =
		scheduler ??
		((callback: () => void) => {
			const interval = resolveValue(
				options.interval ?? "requestAnimationFrame",
			);

			return interval === "requestAnimationFrame"
				? createRafScheduler(
						callback,
						currentWindow,
						allowGlobalWindowFallback,
						immediate,
					)
				: useIntervalFn(callback, options.interval as number, {
						immediate,
					});
		});
	const intervalControls = createScheduler(update);
	const readonlyNow = readonly(now);

	if (exposeControls) {
		return {
			now: readonlyNow,
			...intervalControls,
		} as UseNowReturn<boolean>;
	}

	return readonlyNow as UseNowReturn<boolean>;
}
