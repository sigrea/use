import { signal } from "@sigrea/core";
import { describe, expect, it, vi } from "vitest";

import type {
	BluetoothDeviceLike,
	BluetoothLike,
	BluetoothNavigatorLike,
	BluetoothRemoteGATTServerLike,
} from "../types";
import { useBluetooth } from "./index";

class FakeGATTServer implements BluetoothRemoteGATTServerLike {
	connected = false;
	connectCalls = 0;
	disconnectCalls = 0;

	async connect(): Promise<BluetoothRemoteGATTServerLike> {
		this.connectCalls += 1;
		this.connected = true;
		return this;
	}

	disconnect(): void {
		this.disconnectCalls += 1;
		this.connected = false;
	}
}

class FakeDevice extends EventTarget implements BluetoothDeviceLike {
	constructor(
		readonly id: string,
		readonly name: string,
		readonly gatt?: BluetoothRemoteGATTServerLike | null,
	) {
		super();
	}
}

function createBluetooth(device: BluetoothDeviceLike): BluetoothLike {
	return new (class extends EventTarget implements BluetoothLike {
		requestDevice = vi.fn(async () => device);
	})();
}

function createNavigator(
	bluetooth?: BluetoothLike | null,
): BluetoothNavigatorLike {
	return { bluetooth };
}

describe("useBluetooth", () => {
	it("uses fallback values without bluetooth support", async () => {
		const result = useBluetooth({ navigator: null });

		expect(result.isSupported.value).toBe(false);
		expect(result.isConnected.value).toBe(false);
		expect(result.device.value).toBeUndefined();
		expect(result.server.value).toBeUndefined();
		expect(result.error.value).toBeNull();

		await result.requestDevice();
		result.disconnect();
		result.stop();
	});

	it("treats non-function requestDevice as unsupported", () => {
		const result = useBluetooth({
			navigator: createNavigator({
				requestDevice: true,
			} as unknown as BluetoothLike),
		});

		expect(result.isSupported.value).toBe(false);
		result.stop();
	});

	it("requests a device and connects to its GATT server", async () => {
		const gatt = new FakeGATTServer();
		const device = new FakeDevice("device-1", "Device 1", gatt);
		const bluetooth = createBluetooth(device);
		const result = useBluetooth({
			acceptAllDevices: true,
			navigator: createNavigator(bluetooth),
			optionalServices: ["battery_service"],
		});

		await result.requestDevice();

		expect(result.isSupported.value).toBe(true);
		expect(result.device.value).toBe(device);
		expect(result.server.value).toBe(gatt);
		expect(result.isConnected.value).toBe(true);
		expect(result.error.value).toBeNull();
		expect(bluetooth.requestDevice).toHaveBeenCalledWith({
			acceptAllDevices: true,
			filters: undefined,
			optionalServices: ["battery_service"],
		});
		expect(gatt.connectCalls).toBe(1);
		result.stop();
	});

	it("uses filters instead of acceptAllDevices", async () => {
		const device = new FakeDevice("device-1", "Device 1", new FakeGATTServer());
		const bluetooth = createBluetooth(device);
		const filters = [{ namePrefix: "Sigrea" }];
		const result = useBluetooth({
			acceptAllDevices: true,
			filters,
			navigator: createNavigator(bluetooth),
		});

		await result.requestDevice();

		expect(bluetooth.requestDevice).toHaveBeenCalledWith({
			acceptAllDevices: false,
			filters,
			optionalServices: undefined,
		});
		result.stop();
	});

	it("stores request and connection errors", async () => {
		const requestError = new Error("request denied");
		const requestBluetooth = new (class
			extends EventTarget
			implements BluetoothLike
		{
			requestDevice = vi.fn(async () => {
				throw requestError;
			});
		})();
		const requestResult = useBluetooth({
			navigator: createNavigator(requestBluetooth),
		});

		await requestResult.requestDevice();
		expect(requestResult.error.value).toBe(requestError);
		expect(requestResult.device.value).toBeUndefined();
		requestResult.stop();

		const connectError = new Error("connect failed");
		const gatt: BluetoothRemoteGATTServerLike = {
			connected: false,
			connect: vi.fn(async () => {
				throw connectError;
			}),
			disconnect: vi.fn(),
		};
		const connectResult = useBluetooth({
			navigator: createNavigator(
				createBluetooth(new FakeDevice("id", "name", gatt)),
			),
		});

		await connectResult.requestDevice();
		expect(connectResult.error.value).toBe(connectError);
		expect(connectResult.isConnected.value).toBe(false);
		expect(connectResult.server.value).toBeUndefined();
		connectResult.stop();
	});

	it("ignores old connection errors after disconnect", async () => {
		const connectError = new Error("connect failed");
		let rejectConnect: (error: Error) => void = () => {};
		const gatt: BluetoothRemoteGATTServerLike = {
			connected: false,
			connect: vi.fn(
				() =>
					new Promise<BluetoothRemoteGATTServerLike>((_resolve, reject) => {
						rejectConnect = reject;
					}),
			),
			disconnect: vi.fn(),
		};
		const result = useBluetooth({
			navigator: createNavigator(
				createBluetooth(new FakeDevice("id", "name", gatt)),
			),
		});
		const request = result.requestDevice();

		await Promise.resolve();
		result.disconnect();
		rejectConnect(connectError);
		await request;

		expect(result.error.value).toBeNull();
		expect(result.isConnected.value).toBe(false);
		expect(result.server.value).toBeUndefined();
		result.stop();
	});

	it("resets when the device disconnects", async () => {
		const gatt = new FakeGATTServer();
		const device = new FakeDevice("device-1", "Device 1", gatt);
		const result = useBluetooth({
			navigator: createNavigator(createBluetooth(device)),
		});

		await result.requestDevice();

		device.dispatchEvent(new Event("gattserverdisconnected"));

		expect(result.isConnected.value).toBe(false);
		expect(result.device.value).toBeUndefined();
		expect(result.server.value).toBeUndefined();
		result.stop();
	});

	it("disconnects and removes listeners on stop", async () => {
		const gatt = new FakeGATTServer();
		const device = new FakeDevice("device-1", "Device 1", gatt);
		const result = useBluetooth({
			navigator: createNavigator(createBluetooth(device)),
		});

		await result.requestDevice();
		result.stop();

		expect(gatt.disconnectCalls).toBe(1);
		expect(result.isConnected.value).toBe(false);
		expect(result.device.value).toBeUndefined();

		device.dispatchEvent(new Event("gattserverdisconnected"));
		expect(gatt.disconnectCalls).toBe(1);
	});

	it("uses the current navigator when it changes", async () => {
		const firstBluetooth = createBluetooth(
			new FakeDevice("first", "First", new FakeGATTServer()),
		);
		const secondDevice = new FakeDevice(
			"second",
			"Second",
			new FakeGATTServer(),
		);
		const secondBluetooth = createBluetooth(secondDevice);
		const navigator = signal<BluetoothNavigatorLike | null>(
			createNavigator(firstBluetooth),
		);
		const result = useBluetooth({ navigator });

		navigator.value = createNavigator(secondBluetooth);
		await result.requestDevice();

		expect(firstBluetooth.requestDevice).not.toHaveBeenCalled();
		expect(secondBluetooth.requestDevice).toHaveBeenCalledOnce();
		expect(result.device.value).toBe(secondDevice);
		result.stop();
	});

	it("ignores old request results", async () => {
		const firstDevice = new FakeDevice("first", "First", new FakeGATTServer());
		const secondDevice = new FakeDevice(
			"second",
			"Second",
			new FakeGATTServer(),
		);
		let resolveFirst: (device: BluetoothDeviceLike) => void = () => {};
		const bluetooth = new (class extends EventTarget implements BluetoothLike {
			requestCount = 0;
			requestDevice = vi.fn(() => {
				this.requestCount += 1;
				if (this.requestCount === 1) {
					return new Promise<BluetoothDeviceLike>((resolve) => {
						resolveFirst = resolve;
					});
				}

				return Promise.resolve(secondDevice);
			});
		})();
		const result = useBluetooth({
			navigator: createNavigator(bluetooth),
		});

		const firstRequest = result.requestDevice();
		await result.requestDevice();
		resolveFirst(firstDevice);
		await firstRequest;

		expect(result.device.value).toBe(secondDevice);
		result.stop();
	});

	it("ignores pending request results after disconnect", async () => {
		const device = new FakeDevice("device", "Device", new FakeGATTServer());
		let resolveRequest: (device: BluetoothDeviceLike) => void = () => {};
		const bluetooth = new (class extends EventTarget implements BluetoothLike {
			requestDevice = vi.fn(
				() =>
					new Promise<BluetoothDeviceLike>((resolve) => {
						resolveRequest = resolve;
					}),
			);
		})();
		const result = useBluetooth({
			navigator: createNavigator(bluetooth),
		});
		const request = result.requestDevice();

		result.disconnect();
		resolveRequest(device);
		await request;

		expect(result.isConnected.value).toBe(false);
		expect(result.device.value).toBeUndefined();
		expect(result.server.value).toBeUndefined();
		expect(result.error.value).toBeNull();
		result.stop();
	});
});
