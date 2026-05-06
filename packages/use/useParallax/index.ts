import { computed, readonly, signal, watch } from "@sigrea/core";
import { defaultWindow, listen, resolveTarget } from "../../shared";
import type {
	MaybeTarget,
	UseParallaxOptions,
	UseParallaxReturn,
	UseParallaxScreenOrientationLike,
	UseParallaxSource,
	UseParallaxWindowLike,
} from "../types";
import { useDeviceOrientation } from "../useDeviceOrientation";
import { useMouseInElement } from "../useMouseInElement";

function readScreenOrientationType(
	windowValue: UseParallaxWindowLike | null | undefined,
): OrientationType | undefined {
	return windowValue?.screen?.orientation?.type;
}

function trackScreenOrientation(
	windowTarget: MaybeTarget<UseParallaxWindowLike | null | undefined>,
) {
	const orientation = signal<OrientationType | undefined>(
		readScreenOrientationType(resolveTarget(windowTarget)),
	);
	const stop = watch(
		() => resolveTarget(windowTarget),
		(windowValue, _previousValue, onCleanup) => {
			const sync = () => {
				orientation.value = readScreenOrientationType(windowValue);
			};

			sync();
			if (windowValue === undefined || windowValue === null) {
				return;
			}

			const cleanups = [
				listen(windowValue, "orientationchange", sync, { passive: true }),
			];
			const screenOrientation = windowValue.screen?.orientation;
			if (screenOrientation) {
				cleanups.push(
					listen(
						screenOrientation as UseParallaxScreenOrientationLike,
						"change",
						sync,
						{ passive: true },
					),
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

	return {
		orientation: readonly(orientation),
		stop,
	};
}

function readMouseTilt(x: number, width: number): number {
	if (width === 0) {
		return 0;
	}

	return (x - width / 2) / width;
}

function readMouseRoll(y: number, height: number): number {
	if (height === 0) {
		return 0;
	}

	return -(y - height / 2) / height;
}

export function useParallax<
	TWindow extends UseParallaxWindowLike = UseParallaxWindowLike,
	TElement extends Element = Element,
>(
	target?: MaybeTarget<TElement | null | undefined>,
	options: UseParallaxOptions<TWindow> = {},
): UseParallaxReturn {
	const {
		deviceOrientationRollAdjust = (value) => value,
		deviceOrientationTiltAdjust = (value) => value,
		mouseRollAdjust = (value) => value,
		mouseTiltAdjust = (value) => value,
		absolute,
		requestPermissions,
	} = options;
	const windowTarget =
		"window" in options && options.window !== undefined
			? options.window
			: (defaultWindow as MaybeTarget<TWindow> | undefined);
	const orientation = useDeviceOrientation({
		absolute,
		requestPermissions,
		window: windowTarget,
	});
	const screenOrientation = trackScreenOrientation(
		windowTarget as MaybeTarget<UseParallaxWindowLike | null | undefined>,
	);
	const mouse = useMouseInElement(target, {
		handleOutside: false,
		window: windowTarget,
	});
	const source = computed<UseParallaxSource>(() => {
		if (
			orientation.isSupported.value &&
			((orientation.alpha.value !== null && orientation.alpha.value !== 0) ||
				(orientation.gamma.value !== null && orientation.gamma.value !== 0))
		) {
			return "deviceOrientation";
		}

		return "mouse";
	});
	const roll = computed(() => {
		if (source.value === "deviceOrientation") {
			const beta = orientation.beta.value ?? 0;
			const gamma = orientation.gamma.value ?? 0;
			let value: number;

			switch (screenOrientation.orientation.value) {
				case "landscape-primary":
					value = gamma / 90;
					break;
				case "landscape-secondary":
					value = -gamma / 90;
					break;
				case "portrait-primary":
					value = -beta / 90;
					break;
				case "portrait-secondary":
					value = beta / 90;
					break;
				default:
					value = -beta / 90;
			}

			return deviceOrientationRollAdjust(value);
		}

		return mouseRollAdjust(
			readMouseRoll(mouse.elementY.value, mouse.elementHeight.value),
		);
	});
	const tilt = computed(() => {
		if (source.value === "deviceOrientation") {
			const beta = orientation.beta.value ?? 0;
			const gamma = orientation.gamma.value ?? 0;
			let value: number;

			switch (screenOrientation.orientation.value) {
				case "landscape-primary":
					value = beta / 90;
					break;
				case "landscape-secondary":
					value = -beta / 90;
					break;
				case "portrait-primary":
					value = gamma / 90;
					break;
				case "portrait-secondary":
					value = -gamma / 90;
					break;
				default:
					value = gamma / 90;
			}

			return deviceOrientationTiltAdjust(value);
		}

		return mouseTiltAdjust(
			readMouseTilt(mouse.elementX.value, mouse.elementWidth.value),
		);
	});
	let stopped = false;
	const stop = () => {
		if (stopped) {
			return;
		}

		stopped = true;
		orientation.stop();
		screenOrientation.stop();
		mouse.stop();
	};

	return {
		ensurePermissions: orientation.ensurePermissions,
		roll,
		source,
		stop,
		tilt,
	};
}
