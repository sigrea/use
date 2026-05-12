import { readonly, signal, watch } from "@sigrea/core";

import { defaultWindow, listen, resolveTarget } from "../../shared";
import type {
	MaybeTarget,
	UseDevicePixelRatioOptions,
	UseDevicePixelRatioReturn,
	UseDevicePixelRatioWindowLike,
} from "../types";

function readPixelRatio(
	window: UseDevicePixelRatioWindowLike | null | undefined,
	fallback: number,
): number {
	return typeof window?.devicePixelRatio === "number"
		? window.devicePixelRatio
		: fallback;
}

export function useDevicePixelRatio<
	TWindow extends UseDevicePixelRatioWindowLike = UseDevicePixelRatioWindowLike,
>(
	options: UseDevicePixelRatioOptions<TWindow> = {},
): UseDevicePixelRatioReturn {
	const fallback = options.initialValue ?? 1;
	const windowTarget =
		"window" in options && options.window !== undefined
			? options.window
			: (defaultWindow as MaybeTarget<TWindow> | undefined);
	const initialWindow =
		windowTarget === undefined
			? undefined
			: resolveTarget<TWindow>(windowTarget);
	const pixelRatio = signal(readPixelRatio(initialWindow, fallback));
	const stop = watch(
		() =>
			windowTarget === undefined
				? undefined
				: resolveTarget<TWindow>(windowTarget),
		(nextWindow, _previousWindow, onCleanup) => {
			if (nextWindow === undefined || nextWindow === null) {
				pixelRatio.value = fallback;
				return;
			}

			let stopWatchingResolution: (() => void) | undefined;
			const syncPixelRatio = () => {
				stopWatchingResolution?.();
				pixelRatio.value = readPixelRatio(nextWindow, fallback);

				if (typeof nextWindow.matchMedia !== "function") {
					stopWatchingResolution = undefined;
					return;
				}

				const queryList = nextWindow.matchMedia(
					`(resolution: ${pixelRatio.value}dppx)`,
				);
				stopWatchingResolution = listen(queryList, "change", syncPixelRatio);
			};

			syncPixelRatio();

			onCleanup(() => {
				stopWatchingResolution?.();
				stopWatchingResolution = undefined;
			});
		},
		{ immediate: true, flush: "sync" },
	);

	return {
		pixelRatio: readonly(pixelRatio),
		stop,
	};
}
