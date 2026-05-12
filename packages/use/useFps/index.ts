import { readonly, signal, watch } from "@sigrea/core";

import { defaultWindow, resolveTarget, resolveValue } from "../../shared";
import { bindAutoStart } from "../internal";
import type {
	MaybeTarget,
	UseFpsOptions,
	UseFpsReturn,
	UseFpsWindowLike,
} from "../types";

const defaultEvery = 10;

function normalizeEvery(every: number): number {
	if (!Number.isFinite(every) || every < 1) {
		return defaultEvery;
	}

	return Math.ceil(every);
}

function getRequestAnimationFrame(
	windowTarget: UseFpsWindowLike | undefined,
	allowGlobalFallback: boolean,
): UseFpsWindowLike["requestAnimationFrame"] | undefined {
	return (
		windowTarget?.requestAnimationFrame ??
		(allowGlobalFallback ? globalThis.requestAnimationFrame : undefined)
	);
}

function getCancelAnimationFrame(
	windowTarget: UseFpsWindowLike | undefined,
	allowGlobalFallback: boolean,
): UseFpsWindowLike["cancelAnimationFrame"] | undefined {
	return (
		windowTarget?.cancelAnimationFrame ??
		(allowGlobalFallback ? globalThis.cancelAnimationFrame : undefined)
	);
}

export function useFps<TWindow extends UseFpsWindowLike = UseFpsWindowLike>(
	options: UseFpsOptions<TWindow> = {},
): UseFpsReturn {
	const useDefaultWindow =
		!("window" in options) || options.window === undefined;
	const windowTarget = useDefaultWindow
		? (defaultWindow as MaybeTarget<TWindow> | undefined)
		: options.window;
	const every = options.every ?? defaultEvery;
	const fps = signal(0);
	let active = false;
	let frameHandle: number | undefined;
	let frameWindow: TWindow | undefined;
	let frameVersion = 0;
	let last = 0;
	let ticks = 0;

	const currentWindow = () =>
		windowTarget === undefined
			? undefined
			: resolveTarget<TWindow>(windowTarget);

	const currentPerformance = () =>
		currentWindow()?.performance ??
		(useDefaultWindow ? globalThis.performance : undefined);

	const clearFrame = () => {
		if (frameHandle === undefined) {
			return;
		}

		const cancelFrame = getCancelAnimationFrame(frameWindow, useDefaultWindow);
		if (typeof cancelFrame === "function") {
			cancelFrame.call(frameWindow ?? globalThis, frameHandle);
		}
		frameVersion += 1;
		frameHandle = undefined;
		frameWindow = undefined;
	};

	const update = () => {
		const performanceValue = currentPerformance();
		if (typeof performanceValue?.now !== "function") {
			clearFrame();
			return false;
		}

		ticks += 1;
		const frameCount = normalizeEvery(resolveValue(every));
		if (ticks < frameCount) {
			return true;
		}

		const now = performanceValue.now();
		const diff = now - last;
		fps.value =
			Number.isFinite(diff) && diff > 0 ? Math.round(1000 / (diff / ticks)) : 0;
		last = now;
		ticks = 0;
		return true;
	};

	const scheduleFrame = () => {
		if (!active || frameHandle !== undefined) {
			return;
		}

		const windowValue = currentWindow();
		const requestFrame = getRequestAnimationFrame(
			windowValue,
			useDefaultWindow,
		);
		const performanceValue = currentPerformance();
		if (
			typeof requestFrame !== "function" ||
			typeof performanceValue?.now !== "function"
		) {
			return;
		}

		frameWindow = windowValue;
		const currentFrameVersion = frameVersion;
		frameHandle = requestFrame.call(windowValue ?? globalThis, () => {
			if (!active || currentFrameVersion !== frameVersion) {
				return;
			}

			frameHandle = undefined;
			frameWindow = undefined;

			if (!update()) {
				return;
			}
			scheduleFrame();
		});
	};

	const restartFrame = () => {
		clearFrame();
		ticks = 0;

		const performanceValue = currentPerformance();
		if (typeof performanceValue?.now !== "function") {
			return;
		}

		last = performanceValue.now();
		scheduleFrame();
	};

	const start = () => {
		if (active) {
			return;
		}

		active = true;
		restartFrame();
	};

	const stop = () => {
		active = false;
		ticks = 0;
		clearFrame();
	};

	watch(
		() => currentWindow(),
		(nextWindow, previousWindow) => {
			if (!active || Object.is(nextWindow, previousWindow)) {
				return;
			}

			restartFrame();
		},
		{ flush: "sync" },
	);

	bindAutoStart(start, stop, true);

	return readonly(fps);
}
