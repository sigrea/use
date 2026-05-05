import { readonly, signal, watch } from "@sigrea/core";

import {
	defaultWindow,
	listen,
	resolveTarget,
	resolveValue,
} from "../../shared";
import type {
	DeviceOrientationEventConstructorLike,
	DeviceOrientationPermissionState,
	MaybeTarget,
	MaybeValue,
	UseDeviceOrientationOptions,
	UseDeviceOrientationReturn,
	UseDeviceOrientationWindowLike,
} from "../types";

type DeviceOrientationState = Pick<
	DeviceOrientationEvent,
	"absolute" | "alpha" | "beta" | "gamma"
>;
type DeviceOrientationEventName =
	| "deviceorientation"
	| "deviceorientationabsolute";

function isDeviceOrientationEventConstructor(
	value: unknown,
): value is DeviceOrientationEventConstructorLike {
	return typeof value === "function";
}

function getDeviceOrientationEvent(
	window: UseDeviceOrientationWindowLike | null | undefined,
): DeviceOrientationEventConstructorLike | undefined {
	const eventConstructor = window?.DeviceOrientationEvent;

	return isDeviceOrientationEventConstructor(eventConstructor)
		? eventConstructor
		: undefined;
}

function hasRequestPermission(
	eventConstructor: DeviceOrientationEventConstructorLike | undefined,
): eventConstructor is DeviceOrientationEventConstructorLike & {
	requestPermission(
		absolute?: boolean,
	): Promise<DeviceOrientationPermissionState>;
} {
	return typeof eventConstructor?.requestPermission === "function";
}

/**
 * Reactive DeviceOrientationEvent.
 */
export function useDeviceOrientation<
	TWindow extends
		UseDeviceOrientationWindowLike = UseDeviceOrientationWindowLike,
>(
	options: UseDeviceOrientationOptions<TWindow> = {},
): UseDeviceOrientationReturn {
	const windowTarget: MaybeTarget<TWindow> | undefined =
		"window" in options && options.window !== undefined
			? options.window
			: (defaultWindow as MaybeTarget<TWindow> | undefined);
	const requestPermissions: MaybeValue<boolean> =
		options.requestPermissions ?? false;
	const requestAbsolute: MaybeValue<boolean> = options.absolute ?? false;
	const isSupported = signal(false);
	const requirePermissions = signal(false);
	const permissionGranted = signal(false);
	const isAbsolute = signal(false);
	const alpha = signal<number | null>(null);
	const beta = signal<number | null>(null);
	const gamma = signal<number | null>(null);
	let orientationCleanup: (() => void) | undefined;
	let listeningWindow: UseDeviceOrientationWindowLike | undefined;
	let listeningEventName: DeviceOrientationEventName | undefined;
	let permissionRequestCount = 0;
	let stopped = false;

	const currentWindow = () =>
		windowTarget === undefined
			? undefined
			: resolveTarget<TWindow>(windowTarget);

	const resetOrientation = () => {
		isAbsolute.value = false;
		alpha.value = null;
		beta.value = null;
		gamma.value = null;
	};
	const clearOrientationListener = () => {
		orientationCleanup?.();
		orientationCleanup = undefined;
		listeningWindow = undefined;
		listeningEventName = undefined;
	};
	const clearPermission = () => {
		permissionGranted.value = false;
		clearOrientationListener();
	};
	const syncState = (event: DeviceOrientationState) => {
		isAbsolute.value = event.absolute ?? false;
		alpha.value = event.alpha ?? null;
		beta.value = event.beta ?? null;
		gamma.value = event.gamma ?? null;
	};
	const startListening = (
		window: UseDeviceOrientationWindowLike,
		absolute: boolean,
	) => {
		const eventName: DeviceOrientationEventName = absolute
			? "deviceorientationabsolute"
			: "deviceorientation";

		if (listeningWindow === window && listeningEventName === eventName) {
			return;
		}

		clearOrientationListener();
		listeningWindow = window;
		listeningEventName = eventName;
		orientationCleanup = listen(
			window,
			eventName,
			(event: DeviceOrientationEvent) => {
				syncState(event);
			},
			{ passive: true },
		);
	};
	const updateSupport = (
		window: UseDeviceOrientationWindowLike | undefined,
	) => {
		const eventConstructor = getDeviceOrientationEvent(window);
		isSupported.value = eventConstructor !== undefined;
		requirePermissions.value = hasRequestPermission(eventConstructor);
	};

	const ensurePermissions = async (absolute?: boolean) => {
		if (stopped) {
			return;
		}

		permissionRequestCount += 1;
		const requestId = permissionRequestCount;
		const window = currentWindow();
		const eventConstructor = getDeviceOrientationEvent(window);
		const shouldRequestAbsolute = absolute ?? resolveValue(requestAbsolute);
		updateSupport(window);
		if (window === undefined || eventConstructor === undefined) {
			return;
		}

		if (!hasRequestPermission(eventConstructor)) {
			permissionGranted.value = true;
			startListening(window, shouldRequestAbsolute);
			return;
		}

		try {
			const permission = await eventConstructor.requestPermission(
				shouldRequestAbsolute,
			);
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
			startListening(window, shouldRequestAbsolute);
		} catch {
			if (requestId === permissionRequestCount) {
				clearPermission();
			}
		}
	};

	const stopWatch = watch(
		() => ({
			absolute: resolveValue(requestAbsolute),
			requestPermissions: resolveValue(requestPermissions),
			window: currentWindow(),
		}),
		({ absolute, requestPermissions, window }) => {
			if (stopped) {
				return;
			}

			permissionRequestCount += 1;
			clearOrientationListener();
			resetOrientation();
			permissionGranted.value = false;
			updateSupport(window);

			if (!isSupported.value || window === undefined) {
				return;
			}

			if (requestPermissions && requirePermissions.value) {
				void ensurePermissions(absolute);
				return;
			}

			startListening(window, absolute);
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
		clearOrientationListener();
	};

	return {
		isAbsolute: readonly(isAbsolute),
		alpha: readonly(alpha),
		beta: readonly(beta),
		gamma: readonly(gamma),
		isSupported: readonly(isSupported),
		requirePermissions: readonly(requirePermissions),
		permissionGranted: readonly(permissionGranted),
		ensurePermissions,
		stop,
	};
}
