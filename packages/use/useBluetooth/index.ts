import { readonly, signal, watch } from "@sigrea/core";

import { defaultNavigator, listen, resolveValue } from "../../shared";
import type {
	BluetoothDeviceLike,
	BluetoothNavigatorLike,
	BluetoothRemoteGATTServerLike,
	MaybeValue,
	NavigatorLike,
	UseBluetoothOptions,
	UseBluetoothReturn,
} from "../types";

function isBluetoothNavigator(
	navigator: NavigatorLike | null | undefined,
): navigator is BluetoothNavigatorLike {
	return (
		typeof (navigator as BluetoothNavigatorLike | undefined)?.bluetooth
			?.requestDevice === "function"
	);
}

/**
 * Reactive Web Bluetooth API controls.
 */
export function useBluetooth<
	TNavigator extends NavigatorLike = BluetoothNavigatorLike,
>(options: UseBluetoothOptions<TNavigator> = {}): UseBluetoothReturn {
	const navigatorTarget: MaybeValue<TNavigator | null | undefined> =
		"navigator" in options
			? options.navigator
			: (defaultNavigator as TNavigator | undefined);
	const isSupported = signal(false);
	const isConnected = signal(false);
	const device = signal<BluetoothDeviceLike | undefined>(undefined);
	const server = signal<BluetoothRemoteGATTServerLike | undefined>(undefined);
	const error = signal<unknown | null>(null);
	let requestCount = 0;
	let connectCount = 0;
	let disconnectListener: (() => void) | undefined;

	const currentNavigator = () => resolveValue(navigatorTarget);
	const currentBluetooth = () => {
		const navigator = currentNavigator();

		return isBluetoothNavigator(navigator) ? navigator.bluetooth : undefined;
	};
	const clearDisconnectListener = () => {
		disconnectListener?.();
		disconnectListener = undefined;
	};
	const resetConnectionState = (clearDevice: boolean) => {
		clearDisconnectListener();
		isConnected.value = false;
		server.value = undefined;
		if (clearDevice) {
			device.value = undefined;
		}
	};
	const disconnectCurrentDevice = (clearDevice: boolean) => {
		const currentDevice = device.value;

		resetConnectionState(clearDevice);
		currentDevice?.gatt?.disconnect();
	};
	const setupDisconnectListener = (nextDevice: BluetoothDeviceLike) => {
		clearDisconnectListener();
		disconnectListener = listen(
			nextDevice,
			"gattserverdisconnected",
			() => {
				resetConnectionState(true);
			},
			{ passive: true },
		);
	};

	const connect = async () => {
		error.value = null;
		connectCount += 1;
		const connectId = connectCount;
		const currentDevice = device.value;
		if (currentDevice?.gatt === undefined || currentDevice.gatt === null) {
			return;
		}

		setupDisconnectListener(currentDevice);

		try {
			const connectedServer = await currentDevice.gatt.connect();
			if (connectId !== connectCount || device.value !== currentDevice) {
				return;
			}

			server.value = connectedServer;
			isConnected.value = connectedServer.connected;
		} catch (caughtError) {
			if (connectId === connectCount && device.value === currentDevice) {
				error.value = caughtError;
				isConnected.value = false;
				server.value = undefined;
			}
		}
	};

	const requestDevice = async () => {
		error.value = null;
		requestCount += 1;
		const requestId = requestCount;
		const bluetooth = currentBluetooth();
		isSupported.value = bluetooth !== undefined && bluetooth !== null;
		if (bluetooth === undefined || bluetooth === null) {
			return;
		}

		const resolvedFilters = resolveValue(options.filters);
		const filters =
			resolvedFilters === undefined || resolvedFilters.length === 0
				? undefined
				: resolvedFilters;
		const acceptAllDevices =
			filters === undefined
				? (resolveValue(options.acceptAllDevices) ?? false)
				: false;

		try {
			const nextDevice = await bluetooth.requestDevice({
				acceptAllDevices,
				filters,
				optionalServices: resolveValue(options.optionalServices),
			});
			if (requestId !== requestCount) {
				return;
			}

			disconnectCurrentDevice(false);
			device.value = nextDevice;
			await connect();
		} catch (caughtError) {
			if (requestId === requestCount) {
				error.value = caughtError;
			}
		}
	};

	const disconnect = () => {
		requestCount += 1;
		connectCount += 1;
		disconnectCurrentDevice(true);
	};
	const stopWatch = watch(
		() => currentNavigator(),
		(navigator) => {
			requestCount += 1;
			connectCount += 1;
			isSupported.value = isBluetoothNavigator(navigator);
			disconnectCurrentDevice(true);
		},
		{ immediate: true, flush: "sync" },
	);
	const stop = () => {
		stopWatch();
		disconnect();
	};

	return {
		isSupported: readonly(isSupported),
		isConnected: readonly(isConnected),
		device: readonly(device),
		server: readonly(server),
		error: readonly(error),
		requestDevice,
		connect,
		disconnect,
		stop,
	};
}
