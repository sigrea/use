import { readonly, signal } from "@sigrea/core";

import { defaultWindow, resolveTarget, resolveValue } from "../../shared";
import { bindAutoStart } from "../internal";
import type {
	MaybeTarget,
	UseRafFnCallback,
	UseRafFnOptions,
	UseRafFnReturn,
	UseRafFnWindowLike,
} from "../types";

function getRequestAnimationFrame(
	windowTarget: UseRafFnWindowLike | undefined,
	allowGlobalFallback: boolean,
): UseRafFnWindowLike["requestAnimationFrame"] | undefined {
	return (
		windowTarget?.requestAnimationFrame ??
		(allowGlobalFallback ? globalThis.requestAnimationFrame : undefined)
	);
}

function getCancelAnimationFrame(
	windowTarget: UseRafFnWindowLike | undefined,
	allowGlobalFallback: boolean,
): UseRafFnWindowLike["cancelAnimationFrame"] | undefined {
	return (
		windowTarget?.cancelAnimationFrame ??
		(allowGlobalFallback ? globalThis.cancelAnimationFrame : undefined)
	);
}

function resolveFrameInterval(
	fpsLimit: UseRafFnOptions["fpsLimit"],
): number | undefined {
	const limit = resolveValue(fpsLimit ?? null);
	if (limit === null || !Number.isFinite(limit) || limit <= 0) {
		return undefined;
	}

	return 1000 / limit;
}

export function useRafFn<
	TWindow extends UseRafFnWindowLike = UseRafFnWindowLike,
>(
	callback: UseRafFnCallback,
	options: UseRafFnOptions<TWindow> = {},
): UseRafFnReturn {
	const useDefaultWindow =
		!("window" in options) || options.window === undefined;
	const windowTarget = useDefaultWindow
		? (defaultWindow as MaybeTarget<TWindow> | undefined)
		: options.window;
	const allowGlobalFallback = useDefaultWindow;
	const active = signal(false);
	let frameHandle: number | undefined;
	let frameWindow: TWindow | undefined;
	let previousFrameTimestamp: number | undefined;

	const currentWindow = () =>
		windowTarget === undefined
			? undefined
			: (resolveTarget<TWindow | null | undefined>(windowTarget) ?? undefined);

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

		const windowValue = currentWindow();
		const requestFrame = getRequestAnimationFrame(
			windowValue,
			allowGlobalFallback,
		);
		if (typeof requestFrame !== "function") {
			active.value = false;
			return;
		}

		frameWindow = windowValue;
		frameHandle = requestFrame.call(windowValue ?? globalThis, (timestamp) => {
			frameHandle = undefined;
			frameWindow = undefined;

			if (!active.value) {
				return;
			}

			if (previousFrameTimestamp === undefined) {
				previousFrameTimestamp = timestamp;
			}

			const delta = timestamp - previousFrameTimestamp;
			const frameInterval = resolveFrameInterval(options.fpsLimit);
			if (frameInterval !== undefined && delta < frameInterval) {
				scheduleFrame();
				return;
			}

			previousFrameTimestamp = timestamp;
			callback({ delta, timestamp });

			if (!active.value) {
				return;
			}

			if (options.once === true) {
				active.value = false;
				return;
			}

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
		previousFrameTimestamp = undefined;
		scheduleFrame();
	};

	bindAutoStart(resume, pause, options.immediate ?? true);

	return {
		isActive: readonly(active),
		pause,
		resume,
	};
}
