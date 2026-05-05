import { signal } from "@sigrea/core";
import { describe, expect, it, vi } from "vitest";

import type {
	UseDevicesListMediaDevicesLike,
	UseDevicesListMediaStreamLike,
	UseDevicesListNavigatorLike,
	UseDevicesListPermissionName,
	UseDevicesListPermissionStatusLike,
	UseDevicesListPermissionsLike,
} from "../types";
import { useDevicesList } from "./index";

class FakeMediaDeviceInfo implements MediaDeviceInfo {
	constructor(
		readonly kind: MediaDeviceKind,
		readonly deviceId: string,
		readonly label: string,
		readonly groupId = "group",
	) {}

	toJSON(): unknown {
		return {
			deviceId: this.deviceId,
			groupId: this.groupId,
			kind: this.kind,
			label: this.label,
		};
	}
}

class FakePermissionStatus
	extends EventTarget
	implements UseDevicesListPermissionStatusLike
{
	constructor(readonly state: PermissionState) {
		super();
	}
}

class FakeStream implements UseDevicesListMediaStreamLike {
	readonly tracks = [{ stop: vi.fn() }, { stop: vi.fn() }];

	getTracks() {
		return this.tracks;
	}
}

class FakeMediaDevices
	extends EventTarget
	implements UseDevicesListMediaDevicesLike
{
	readonly listeners = new Set<EventListenerOrEventListenerObject>();
	enumerateDevices = vi.fn(async () => [...this.deviceList]);
	getUserMedia = vi.fn(async () => this.stream);

	constructor(
		private deviceList: readonly MediaDeviceInfo[],
		readonly stream = new FakeStream(),
	) {
		super();
	}

	setDevices(devices: readonly MediaDeviceInfo[]) {
		this.deviceList = devices;
	}

	addEventListener(
		type: string,
		callback: EventListenerOrEventListenerObject | null,
		options?: boolean | AddEventListenerOptions,
	): void {
		if (type === "devicechange" && callback !== null) {
			this.listeners.add(callback);
		}
		super.addEventListener(type, callback, options);
	}

	removeEventListener(
		type: string,
		callback: EventListenerOrEventListenerObject | null,
		options?: boolean | EventListenerOptions,
	): void {
		if (type === "devicechange" && callback !== null) {
			this.listeners.delete(callback);
		}
		super.removeEventListener(type, callback, options);
	}
}

function createPermissions(
	states: Partial<Record<UseDevicesListPermissionName, PermissionState>>,
): UseDevicesListPermissionsLike {
	return {
		query: vi.fn(
			async ({
				name,
			}: {
				readonly name: UseDevicesListPermissionName;
			}) => {
				const state = states[name] ?? "prompt";
				return new FakePermissionStatus(state);
			},
		),
	};
}

function createNavigator(
	mediaDevices?: UseDevicesListMediaDevicesLike | null,
	permissions?: UseDevicesListPermissionsLike | null,
): UseDevicesListNavigatorLike {
	return { mediaDevices, permissions };
}

function createDeferred<T>() {
	let resolve!: (value: T) => void;
	let reject!: (reason?: unknown) => void;
	const promise = new Promise<T>((resolvePromise, rejectPromise) => {
		resolve = resolvePromise;
		reject = rejectPromise;
	});

	return { promise, reject, resolve };
}

const camera = new FakeMediaDeviceInfo("videoinput", "camera-1", "Camera");
const microphone = new FakeMediaDeviceInfo(
	"audioinput",
	"microphone-1",
	"Microphone",
);
const speaker = new FakeMediaDeviceInfo("audiooutput", "speaker-1", "Speaker");

describe("useDevicesList", () => {
	it("uses fallback values without mediaDevices support", async () => {
		const result = useDevicesList({ navigator: null });

		expect(result.isSupported.value).toBe(false);
		expect(result.devices.value).toEqual([]);
		expect(result.videoInputs.value).toEqual([]);
		expect(result.audioInputs.value).toEqual([]);
		expect(result.audioOutputs.value).toEqual([]);
		expect(result.permissionGranted.value).toBe(false);
		await expect(result.ensurePermissions()).resolves.toBe(false);

		result.stop();
	});

	it("enumerates devices and groups them by kind", async () => {
		const onUpdated = vi.fn();
		const mediaDevices = new FakeMediaDevices([camera, microphone, speaker]);
		const result = useDevicesList({
			navigator: createNavigator(mediaDevices),
			onUpdated,
		});

		await vi.waitFor(() => {
			expect(result.devices.value).toHaveLength(3);
		});

		expect(result.isSupported.value).toBe(true);
		expect(result.videoInputs.value).toEqual([camera]);
		expect(result.audioInputs.value).toEqual([microphone]);
		expect(result.audioOutputs.value).toEqual([speaker]);
		expect(onUpdated).toHaveBeenCalledWith([camera, microphone, speaker]);

		result.stop();
	});

	it("updates on devicechange and removes the listener on stop", async () => {
		const mediaDevices = new FakeMediaDevices([camera]);
		const result = useDevicesList({
			navigator: createNavigator(mediaDevices),
		});
		await vi.waitFor(() => {
			expect(result.devices.value).toEqual([camera]);
		});

		expect(mediaDevices.listeners.size).toBe(1);
		mediaDevices.setDevices([camera, microphone]);
		mediaDevices.dispatchEvent(new Event("devicechange"));
		await vi.waitFor(() => {
			expect(result.devices.value).toEqual([camera, microphone]);
		});

		result.stop();
		expect(mediaDevices.listeners.size).toBe(0);
		mediaDevices.setDevices([speaker]);
		mediaDevices.dispatchEvent(new Event("devicechange"));
		await Promise.resolve();

		expect(result.devices.value).toEqual([camera, microphone]);
	});

	it("uses Permissions API grants without opening a media stream", async () => {
		const mediaDevices = new FakeMediaDevices([camera, microphone]);
		const permissions = createPermissions({
			camera: "granted",
			microphone: "granted",
		});
		const result = useDevicesList({
			navigator: createNavigator(mediaDevices, permissions),
		});

		await expect(result.ensurePermissions()).resolves.toBe(true);

		expect(result.permissionGranted.value).toBe(true);
		expect(permissions.query).toHaveBeenCalledWith({ name: "microphone" });
		expect(permissions.query).toHaveBeenCalledWith({ name: "camera" });
		expect(mediaDevices.getUserMedia).not.toHaveBeenCalled();

		result.stop();
	});

	it("requests media permission and stops the temporary stream", async () => {
		const stream = new FakeStream();
		const mediaDevices = new FakeMediaDevices([camera, microphone], stream);
		const permissions = createPermissions({
			camera: "prompt",
			microphone: "prompt",
		});
		const result = useDevicesList({
			navigator: createNavigator(mediaDevices, permissions),
		});

		await expect(result.ensurePermissions()).resolves.toBe(true);

		expect(mediaDevices.getUserMedia).toHaveBeenCalledWith({
			audio: true,
			video: true,
		});
		expect(stream.tracks[0].stop).toHaveBeenCalledOnce();
		expect(stream.tracks[1].stop).toHaveBeenCalledOnce();
		expect(result.permissionGranted.value).toBe(true);

		result.stop();
	});

	it("does not request a stream when permission is denied", async () => {
		const mediaDevices = new FakeMediaDevices([camera, microphone]);
		const result = useDevicesList({
			navigator: createNavigator(
				mediaDevices,
				createPermissions({ camera: "denied", microphone: "granted" }),
			),
		});

		await expect(result.ensurePermissions()).resolves.toBe(false);

		expect(mediaDevices.getUserMedia).not.toHaveBeenCalled();
		expect(result.permissionGranted.value).toBe(false);

		result.stop();
	});

	it("keeps the latest device enumeration when older reads finish later", async () => {
		const firstRead = createDeferred<readonly MediaDeviceInfo[]>();
		const secondRead = createDeferred<readonly MediaDeviceInfo[]>();
		const mediaDevices = new FakeMediaDevices([]);
		mediaDevices.enumerateDevices = vi
			.fn<UseDevicesListMediaDevicesLike["enumerateDevices"]>()
			.mockReturnValueOnce(firstRead.promise)
			.mockReturnValueOnce(secondRead.promise);
		const result = useDevicesList({
			navigator: createNavigator(mediaDevices),
		});

		mediaDevices.dispatchEvent(new Event("devicechange"));
		secondRead.resolve([microphone]);
		await vi.waitFor(() => {
			expect(result.devices.value).toEqual([microphone]);
		});

		firstRead.resolve([camera]);
		await Promise.resolve();
		await Promise.resolve();

		expect(result.devices.value).toEqual([microphone]);

		result.stop();
	});

	it("returns false when getUserMedia rejects", async () => {
		const mediaDevices = new FakeMediaDevices([camera]);
		mediaDevices.getUserMedia = vi.fn(async () => {
			throw new Error("Permission denied");
		});
		const result = useDevicesList({
			constraints: { audio: false, video: true },
			navigator: createNavigator(
				mediaDevices,
				createPermissions({ camera: "prompt" }),
			),
		});

		await expect(result.ensurePermissions()).resolves.toBe(false);

		expect(mediaDevices.getUserMedia).toHaveBeenCalledWith({
			audio: false,
			video: true,
		});
		expect(result.permissionGranted.value).toBe(false);

		result.stop();
	});

	it("does not request media when no requested input devices are available", async () => {
		const mediaDevices = new FakeMediaDevices([speaker]);
		const result = useDevicesList({
			constraints: { audio: true, video: false },
			navigator: createNavigator(mediaDevices),
		});

		await expect(result.ensurePermissions()).resolves.toBe(false);

		expect(mediaDevices.getUserMedia).not.toHaveBeenCalled();
		expect(result.permissionGranted.value).toBe(false);

		result.stop();
	});

	it("stops a stale permission stream without updating state", async () => {
		const stream = new FakeStream();
		const permissionRequest = createDeferred<UseDevicesListMediaStreamLike>();
		const mediaDevices = new FakeMediaDevices([camera], stream);
		mediaDevices.getUserMedia = vi.fn(() => permissionRequest.promise);
		const result = useDevicesList({
			constraints: { audio: false, video: true },
			navigator: createNavigator(mediaDevices),
		});
		const permissions = result.ensurePermissions();

		await vi.waitFor(() => {
			expect(mediaDevices.getUserMedia).toHaveBeenCalled();
		});

		result.stop();
		permissionRequest.resolve(stream);

		await expect(permissions).resolves.toBe(false);
		expect(result.permissionGranted.value).toBe(false);
		expect(stream.tracks[0].stop).toHaveBeenCalledOnce();
		expect(stream.tracks[1].stop).toHaveBeenCalledOnce();
	});

	it("stops a temporary stream immediately when stopped during the post-permission refresh", async () => {
		const postPermissionRead = createDeferred<readonly MediaDeviceInfo[]>();
		const stream = new FakeStream();
		const mediaDevices = new FakeMediaDevices([camera], stream);
		mediaDevices.enumerateDevices = vi
			.fn<UseDevicesListMediaDevicesLike["enumerateDevices"]>()
			.mockResolvedValueOnce([camera])
			.mockResolvedValueOnce([camera])
			.mockReturnValueOnce(postPermissionRead.promise);
		const result = useDevicesList({
			constraints: { audio: false, video: true },
			navigator: createNavigator(mediaDevices),
		});

		await vi.waitFor(() => {
			expect(result.devices.value).toEqual([camera]);
		});
		const permissions = result.ensurePermissions();
		await vi.waitFor(() => {
			expect(mediaDevices.getUserMedia).toHaveBeenCalled();
		});
		await Promise.resolve();

		result.stop();

		expect(stream.tracks[0].stop).toHaveBeenCalledOnce();
		expect(stream.tracks[1].stop).toHaveBeenCalledOnce();
		expect(result.permissionGranted.value).toBe(false);

		postPermissionRead.resolve([camera]);
		await expect(permissions).resolves.toBe(false);
	});

	it("stops a temporary stream immediately when the navigator changes during the post-permission refresh", async () => {
		const postPermissionRead = createDeferred<readonly MediaDeviceInfo[]>();
		const stream = new FakeStream();
		const firstMediaDevices = new FakeMediaDevices([camera], stream);
		firstMediaDevices.enumerateDevices = vi
			.fn<UseDevicesListMediaDevicesLike["enumerateDevices"]>()
			.mockResolvedValueOnce([camera])
			.mockResolvedValueOnce([camera])
			.mockReturnValueOnce(postPermissionRead.promise);
		const secondMediaDevices = new FakeMediaDevices([microphone]);
		const navigator = signal<UseDevicesListNavigatorLike | null>(
			createNavigator(firstMediaDevices),
		);
		const result = useDevicesList({
			constraints: { audio: false, video: true },
			navigator,
		});

		await vi.waitFor(() => {
			expect(result.devices.value).toEqual([camera]);
		});
		const permissions = result.ensurePermissions();
		await vi.waitFor(() => {
			expect(firstMediaDevices.getUserMedia).toHaveBeenCalled();
		});
		await Promise.resolve();

		navigator.value = createNavigator(secondMediaDevices);

		expect(stream.tracks[0].stop).toHaveBeenCalledOnce();
		expect(stream.tracks[1].stop).toHaveBeenCalledOnce();
		await vi.waitFor(() => {
			expect(result.devices.value).toEqual([microphone]);
		});

		postPermissionRead.resolve([camera]);
		await expect(permissions).resolves.toBe(false);
		expect(result.devices.value).toEqual([microphone]);

		result.stop();
	});

	it("retargets devicechange listeners when the navigator changes", async () => {
		const firstMediaDevices = new FakeMediaDevices([camera]);
		const secondMediaDevices = new FakeMediaDevices([microphone]);
		const navigator = signal<UseDevicesListNavigatorLike | null>(
			createNavigator(firstMediaDevices),
		);
		const result = useDevicesList({ navigator });

		await vi.waitFor(() => {
			expect(result.devices.value).toEqual([camera]);
		});
		expect(firstMediaDevices.listeners.size).toBe(1);

		navigator.value = createNavigator(secondMediaDevices);
		await vi.waitFor(() => {
			expect(result.devices.value).toEqual([microphone]);
		});

		expect(firstMediaDevices.listeners.size).toBe(0);
		expect(secondMediaDevices.listeners.size).toBe(1);

		firstMediaDevices.setDevices([speaker]);
		firstMediaDevices.dispatchEvent(new Event("devicechange"));
		await Promise.resolve();
		expect(result.devices.value).toEqual([microphone]);

		result.stop();
		expect(secondMediaDevices.listeners.size).toBe(0);
	});

	it("requests permissions during setup when configured", async () => {
		const mediaDevices = new FakeMediaDevices([microphone]);
		const result = useDevicesList({
			constraints: { audio: true, video: false },
			navigator: createNavigator(mediaDevices),
			requestPermissions: true,
		});

		await vi.waitFor(() => {
			expect(result.permissionGranted.value).toBe(true);
		});

		expect(mediaDevices.getUserMedia).toHaveBeenCalledWith({
			audio: true,
			video: false,
		});

		result.stop();
	});
});
