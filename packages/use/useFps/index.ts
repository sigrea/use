import { readonly, signal } from "@sigrea/core";

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
		frameHandle = undefined;
		frameWindow = undefined;
	};

	const update = () => {
		const performanceValue = currentPerformance();
		if (typeof performanceValue?.now !== "function") {
			active = false;
			clearFrame();
			return;
		}

		ticks += 1;
		const frameCount = normalizeEvery(resolveValue(every));
		if (ticks < frameCount) {
			return;
		}

		const now = performanceValue.now();
		const diff = now - last;
		fps.value =
			Number.isFinite(diff) && diff > 0 ? Math.round(1000 / (diff / ticks)) : 0;
		last = now;
		ticks = 0;
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
			active = false;
			return;
		}

		frameWindow = windowValue;
		frameHandle = requestFrame.call(windowValue ?? globalThis, () => {
			frameHandle = undefined;
			frameWindow = undefined;

			if (!active) {
				return;
			}

			update();
			scheduleFrame();
		});
	};

	const start = () => {
		if (active) {
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

		active = true;
		ticks = 0;
		last = performanceValue.now();
		scheduleFrame();
	};

	const stop = () => {
		active = false;
		ticks = 0;
		clearFrame();
	};

	bindAutoStart(start, stop, true);

	return readonly(fps);
}
