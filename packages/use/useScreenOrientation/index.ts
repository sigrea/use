import { readonly, signal, watch } from "@sigrea/core";

import { defaultWindow, listen, resolveTarget } from "../../shared";
import type {
	MaybeTarget,
	OrientationLockType,
	OrientationType,
	UseScreenOrientationOptions,
	UseScreenOrientationReturn,
	UseScreenOrientationScreenOrientationLike,
	UseScreenOrientationWindowLike,
} from "../types";

function getScreenOrientation(
	window: UseScreenOrientationWindowLike | null | undefined,
): UseScreenOrientationScreenOrientationLike | undefined {
	return window?.screen?.orientation ?? undefined;
}

function readAngle(
	screenOrientation: UseScreenOrientationScreenOrientationLike | undefined,
): number {
	return typeof screenOrientation?.angle === "number"
		? screenOrientation.angle
		: 0;
}

function createNotSupportedError() {
	return new Error("Screen Orientation API is not supported");
}

export function useScreenOrientation<
	TWindow extends
		UseScreenOrientationWindowLike = UseScreenOrientationWindowLike,
>(
	options: UseScreenOrientationOptions<TWindow> = {},
): UseScreenOrientationReturn {
	const windowTarget =
		"window" in options && options.window !== undefined
			? options.window
			: (defaultWindow as MaybeTarget<TWindow | null | undefined> | undefined);
	const isSupported = signal(false);
	const orientation = signal<OrientationType | undefined>(undefined);
	const angle = signal(0);
	let stopped = false;

	const currentWindow = () =>
		windowTarget === undefined
			? undefined
			: resolveTarget<TWindow | null | undefined>(windowTarget);
	const syncOrientation = (
		window: UseScreenOrientationWindowLike | null | undefined,
	) => {
		const screenOrientation = getScreenOrientation(window);

		isSupported.value = screenOrientation !== undefined;
		orientation.value = screenOrientation?.type;
		angle.value = readAngle(screenOrientation);
	};

	const stopWatch = watch(
		() => currentWindow(),
		(window, _previousWindow, onCleanup) => {
			if (stopped) {
				return;
			}

			syncOrientation(window);

			if (window === undefined || window === null) {
				return;
			}

			const sync = () => {
				syncOrientation(window);
			};
			const cleanups = [
				listen(window, "orientationchange", sync, { passive: true }),
			];
			const screenOrientation = getScreenOrientation(window);
			if (screenOrientation !== undefined) {
				cleanups.push(
					listen(screenOrientation, "change", sync, { passive: true }),
				);
			}

			onCleanup(() => {
				for (const cleanup of cleanups) {
					cleanup();
				}
			});
		},
		{ immediate: true, flush: "sync" },
	);

	const lockOrientation = (type: OrientationLockType) => {
		const screenOrientation = getScreenOrientation(currentWindow());

		if (
			screenOrientation === undefined ||
			typeof screenOrientation.lock !== "function"
		) {
			return Promise.reject(createNotSupportedError());
		}

		return screenOrientation.lock(type);
	};
	const unlockOrientation = () => {
		const screenOrientation = getScreenOrientation(currentWindow());

		if (typeof screenOrientation?.unlock === "function") {
			screenOrientation.unlock();
		}
	};
	const stop = () => {
		if (stopped) {
			return;
		}

		stopped = true;
		stopWatch();
	};

	return {
		isSupported: readonly(isSupported),
		orientation: readonly(orientation),
		angle: readonly(angle),
		lockOrientation,
		unlockOrientation,
		stop,
	};
}
