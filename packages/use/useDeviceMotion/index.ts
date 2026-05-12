import { readonly, signal, watch } from "@sigrea/core";

import {
	defaultWindow,
	listen,
	resolveTarget,
	resolveValue,
} from "../../shared";
import type {
	DeviceMotionEventConstructorLike,
	DeviceMotionPermissionState,
	MaybeTarget,
	MaybeValue,
	UseDeviceMotionOptions,
	UseDeviceMotionReturn,
	UseDeviceMotionWindowLike,
} from "../types";

type DeviceMotionState = Pick<
	DeviceMotionEvent,
	"acceleration" | "accelerationIncludingGravity" | "interval" | "rotationRate"
>;

function emptyAcceleration(): DeviceMotionEventAcceleration {
	return { x: null, y: null, z: null };
}

function emptyRotationRate(): DeviceMotionEventRotationRate {
	return { alpha: null, beta: null, gamma: null };
}

function isDeviceMotionEventConstructor(
	value: unknown,
): value is DeviceMotionEventConstructorLike {
	return typeof value === "function";
}

function getDeviceMotionEvent(
	window: UseDeviceMotionWindowLike | null | undefined,
): DeviceMotionEventConstructorLike | undefined {
	const eventConstructor = window?.DeviceMotionEvent;

	return isDeviceMotionEventConstructor(eventConstructor)
		? eventConstructor
		: undefined;
}

function hasRequestPermission(
	eventConstructor: DeviceMotionEventConstructorLike | undefined,
): eventConstructor is DeviceMotionEventConstructorLike & {
	requestPermission(): Promise<DeviceMotionPermissionState>;
} {
	return typeof eventConstructor?.requestPermission === "function";
}

function normalizeAcceleration(
	value: DeviceMotionEventAcceleration | null,
): DeviceMotionEventAcceleration {
	return {
		x: value?.x ?? null,
		y: value?.y ?? null,
		z: value?.z ?? null,
	};
}

function normalizeRotationRate(
	value: DeviceMotionEventRotationRate | null,
): DeviceMotionEventRotationRate {
	return {
		alpha: value?.alpha ?? null,
		beta: value?.beta ?? null,
		gamma: value?.gamma ?? null,
	};
}

/**
 * Reactive DeviceMotionEvent.
 */
export function useDeviceMotion<
	TWindow extends UseDeviceMotionWindowLike = UseDeviceMotionWindowLike,
>(options: UseDeviceMotionOptions<TWindow> = {}): UseDeviceMotionReturn {
	const windowTarget: MaybeTarget<TWindow> | undefined =
		"window" in options && options.window !== undefined
			? options.window
			: (defaultWindow as MaybeTarget<TWindow> | undefined);
	const requestPermissions: MaybeValue<boolean> =
		options.requestPermissions ?? false;
	const isSupported = signal(false);
	const requirePermissions = signal(false);
	const permissionGranted = signal(false);
	const acceleration = signal<DeviceMotionEventAcceleration | null>(
		emptyAcceleration(),
	);
	const accelerationIncludingGravity =
		signal<DeviceMotionEventAcceleration | null>(emptyAcceleration());
	const rotationRate = signal<DeviceMotionEventRotationRate | null>(
		emptyRotationRate(),
	);
	const interval = signal(0);
	let motionCleanup: (() => void) | undefined;
	let listeningWindow: UseDeviceMotionWindowLike | undefined;
	let permissionRequestCount = 0;
	let stopped = false;

	const currentWindow = () =>
		windowTarget === undefined
			? undefined
			: resolveTarget<TWindow>(windowTarget);

	const resetMotion = () => {
		acceleration.value = emptyAcceleration();
		accelerationIncludingGravity.value = emptyAcceleration();
		rotationRate.value = emptyRotationRate();
		interval.value = 0;
	};
	const clearMotionListener = () => {
		motionCleanup?.();
		motionCleanup = undefined;
		listeningWindow = undefined;
	};
	const clearPermission = () => {
		permissionGranted.value = false;
		clearMotionListener();
	};
	const syncState = (event: DeviceMotionState) => {
		acceleration.value = normalizeAcceleration(event.acceleration);
		accelerationIncludingGravity.value = normalizeAcceleration(
			event.accelerationIncludingGravity,
		);
		rotationRate.value = normalizeRotationRate(event.rotationRate);
		interval.value = event.interval;
	};
	const startListening = (window: UseDeviceMotionWindowLike) => {
		if (listeningWindow === window) {
			return;
		}

		clearMotionListener();
		listeningWindow = window;
		motionCleanup = listen(
			window,
			"devicemotion",
			(event: DeviceMotionEvent) => {
				syncState(event);
			},
			{ passive: true },
		);
	};
	const updateSupport = (window: UseDeviceMotionWindowLike | undefined) => {
		const eventConstructor = getDeviceMotionEvent(window);
		isSupported.value = eventConstructor !== undefined;
		requirePermissions.value = hasRequestPermission(eventConstructor);
	};

	const ensurePermissions = async () => {
		if (stopped) {
			return;
		}

		permissionRequestCount += 1;
		const requestId = permissionRequestCount;
		const window = currentWindow();
		const eventConstructor = getDeviceMotionEvent(window);
		updateSupport(window);
		if (window === undefined || eventConstructor === undefined) {
			return;
		}

		if (!hasRequestPermission(eventConstructor)) {
			permissionGranted.value = true;
			startListening(window);
			return;
		}

		try {
			const permission = await eventConstructor.requestPermission();
			if (
				requestId !== permissionRequestCount ||
				stopped ||
				currentWindow() !== window
			) {
				return;
			}

			if (permission !== "granted") {
				clearPermission();
				return;
			}

			permissionGranted.value = true;
			startListening(window);
		} catch {
			if (requestId === permissionRequestCount) {
				clearPermission();
			}
		}
	};

	const stopWatch = watch(
		() => ({
			requestPermissions: resolveValue(requestPermissions),
			window: currentWindow(),
		}),
		({ requestPermissions, window }) => {
			if (stopped) {
				return;
			}

			permissionRequestCount += 1;
			clearMotionListener();
			resetMotion();
			permissionGranted.value = false;
			updateSupport(window);

			if (!isSupported.value || window === undefined) {
				return;
			}

			if (requestPermissions && requirePermissions.value) {
				void ensurePermissions();
				return;
			}

			startListening(window);
		},
		{ immediate: true, flush: "sync" },
	);
	const stop = () => {
		if (stopped) {
			return;
		}
		stopped = true;
		permissionRequestCount += 1;
		stopWatch();
		clearMotionListener();
	};

	return {
		acceleration: readonly(acceleration),
		accelerationIncludingGravity: readonly(accelerationIncludingGravity),
		rotationRate: readonly(rotationRate),
		interval: readonly(interval),
		isSupported: readonly(isSupported),
		requirePermissions: readonly(requirePermissions),
		permissionGranted: readonly(permissionGranted),
		ensurePermissions,
		stop,
	};
}
