import { signal } from "@sigrea/core";
import { describe, expect, it, vi } from "vitest";

import type {
	DeviceMotionEventConstructorLike,
	DeviceMotionPermissionState,
	UseDeviceMotionWindowLike,
} from "../types";
import { useDeviceMotion } from "./index";

function normalizeAccelerationInit(
	value: DeviceMotionEventAccelerationInit | undefined,
): DeviceMotionEventAcceleration | null {
	if (value === undefined) {
		return null;
	}

	return {
		x: value.x ?? null,
		y: value.y ?? null,
		z: value.z ?? null,
	};
}

function normalizeRotationRateInit(
	value: DeviceMotionEventRotationRateInit | undefined,
): DeviceMotionEventRotationRate | null {
	if (value === undefined) {
		return null;
	}

	return {
		alpha: value.alpha ?? null,
		beta: value.beta ?? null,
		gamma: value.gamma ?? null,
	};
}

class FakeDeviceMotionEvent extends Event implements DeviceMotionEvent {
	readonly acceleration: DeviceMotionEventAcceleration | null;
	readonly accelerationIncludingGravity: DeviceMotionEventAcceleration | null;
	readonly interval: number;
	readonly rotationRate: DeviceMotionEventRotationRate | null;

	constructor(type: string, init: DeviceMotionEventInit = {}) {
		super(type, init);
		this.acceleration = normalizeAccelerationInit(init.acceleration);
		this.accelerationIncludingGravity = normalizeAccelerationInit(
			init.accelerationIncludingGravity,
		);
		this.interval = init.interval ?? 0;
		this.rotationRate = normalizeRotationRateInit(init.rotationRate);
	}
}

class FakeWindow extends EventTarget implements UseDeviceMotionWindowLike {
	constructor(readonly DeviceMotionEvent?: DeviceMotionEventConstructorLike) {
		super();
	}
}

function createWindow(
	eventConstructor: DeviceMotionEventConstructorLike = FakeDeviceMotionEvent,
): UseDeviceMotionWindowLike {
	return new FakeWindow(eventConstructor);
}

function createMotionEvent(
	init: DeviceMotionEventInit = {},
): DeviceMotionEvent {
	return new FakeDeviceMotionEvent("devicemotion", init);
}

function createPermissionConstructor(
	response: DeviceMotionPermissionState | Promise<DeviceMotionPermissionState>,
): DeviceMotionEventConstructorLike {
	return class PermissionDeviceMotionEvent extends FakeDeviceMotionEvent {
		static requestPermission = vi.fn(() => Promise.resolve(response));
	};
}

function createMutablePermissionConstructor(
	initialResponse: DeviceMotionPermissionState,
) {
	let response = initialResponse;
	const DeviceMotionEvent = class PermissionDeviceMotionEvent extends FakeDeviceMotionEvent {
		static requestPermission = vi.fn(() => Promise.resolve(response));
	};

	return {
		DeviceMotionEvent,
		setResponse(nextResponse: DeviceMotionPermissionState) {
			response = nextResponse;
		},
	};
}

function createDeferredPermissionConstructor() {
	let resolvePermission!: (value: DeviceMotionPermissionState) => void;
	const permission = new Promise<DeviceMotionPermissionState>((resolve) => {
		resolvePermission = resolve;
	});
	const DeviceMotionEvent = class PermissionDeviceMotionEvent extends FakeDeviceMotionEvent {
		static requestPermission = vi.fn(() => permission);
	};

	return { DeviceMotionEvent, resolvePermission };
}

describe("useDeviceMotion", () => {
	it("uses fallback values without DeviceMotionEvent support", async () => {
		const result = useDeviceMotion({ window: null });

		expect(result.isSupported.value).toBe(false);
		expect(result.requirePermissions.value).toBe(false);
		expect(result.permissionGranted.value).toBe(false);
		expect(result.acceleration.value).toEqual({ x: null, y: null, z: null });
		expect(result.accelerationIncludingGravity.value).toEqual({
			x: null,
			y: null,
			z: null,
		});
		expect(result.rotationRate.value).toEqual({
			alpha: null,
			beta: null,
			gamma: null,
		});
		expect(result.interval.value).toBe(0);

		await result.ensurePermissions();
		result.stop();
	});

	it("updates motion values from devicemotion events", () => {
		const window = createWindow();
		const result = useDeviceMotion({ window });

		window.dispatchEvent(
			createMotionEvent({
				acceleration: { x: 0, y: 1, z: null },
				accelerationIncludingGravity: { x: 2, y: 0, z: 3 },
				rotationRate: { alpha: 0, beta: 4, gamma: null },
				interval: 16,
			}),
		);

		expect(result.isSupported.value).toBe(true);
		expect(result.acceleration.value).toEqual({ x: 0, y: 1, z: null });
		expect(result.accelerationIncludingGravity.value).toEqual({
			x: 2,
			y: 0,
			z: 3,
		});
		expect(result.rotationRate.value).toEqual({
			alpha: 0,
			beta: 4,
			gamma: null,
		});
		expect(result.interval.value).toBe(16);
		result.stop();
	});

	it("resets null event fields to empty motion objects", () => {
		const window = createWindow();
		const result = useDeviceMotion({ window });

		window.dispatchEvent(createMotionEvent({ interval: 8 }));

		expect(result.acceleration.value).toEqual({ x: null, y: null, z: null });
		expect(result.accelerationIncludingGravity.value).toEqual({
			x: null,
			y: null,
			z: null,
		});
		expect(result.rotationRate.value).toEqual({
			alpha: null,
			beta: null,
			gamma: null,
		});
		expect(result.interval.value).toBe(8);
		result.stop();
	});

	it("requests permission before listening when configured", async () => {
		const DeviceMotionEvent = createPermissionConstructor("granted");
		const window = createWindow(DeviceMotionEvent);
		const result = useDeviceMotion({ requestPermissions: true, window });

		expect(result.isSupported.value).toBe(true);
		expect(result.requirePermissions.value).toBe(true);
		expect(result.permissionGranted.value).toBe(false);

		await vi.waitFor(() => {
			expect(result.permissionGranted.value).toBe(true);
		});

		window.dispatchEvent(
			createMotionEvent({
				acceleration: { x: 1, y: 2, z: 3 },
				interval: 32,
			}),
		);

		expect(result.acceleration.value).toEqual({ x: 1, y: 2, z: 3 });
		expect(result.interval.value).toBe(32);
		expect(DeviceMotionEvent.requestPermission).toHaveBeenCalledOnce();
		result.stop();
	});

	it("keeps fallback values when permission is denied", async () => {
		const DeviceMotionEvent = createPermissionConstructor("denied");
		const window = createWindow(DeviceMotionEvent);
		const result = useDeviceMotion({ requestPermissions: true, window });

		await Promise.resolve();
		window.dispatchEvent(
			createMotionEvent({
				acceleration: { x: 1, y: 2, z: 3 },
				interval: 32,
			}),
		);

		expect(result.permissionGranted.value).toBe(false);
		expect(result.acceleration.value).toEqual({ x: null, y: null, z: null });
		expect(result.interval.value).toBe(0);
		result.stop();
	});

	it("keeps fallback values when permission rejects", async () => {
		const DeviceMotionEvent = class PermissionDeviceMotionEvent extends FakeDeviceMotionEvent {
			static requestPermission = vi.fn(() =>
				Promise.reject(new Error("permission failed")),
			);
		};
		const window = createWindow(DeviceMotionEvent);
		const result = useDeviceMotion({ requestPermissions: true, window });

		await Promise.resolve();
		await Promise.resolve();
		window.dispatchEvent(
			createMotionEvent({
				acceleration: { x: 1, y: 2, z: 3 },
				interval: 32,
			}),
		);

		expect(result.permissionGranted.value).toBe(false);
		expect(result.acceleration.value).toEqual({ x: null, y: null, z: null });
		expect(result.interval.value).toBe(0);
		result.stop();
	});

	it("clears a granted listener when permission is later denied", async () => {
		const { DeviceMotionEvent, setResponse } =
			createMutablePermissionConstructor("granted");
		const window = createWindow(DeviceMotionEvent);
		const result = useDeviceMotion({ window });

		await result.ensurePermissions();
		window.dispatchEvent(
			createMotionEvent({
				acceleration: { x: 1, y: 2, z: 3 },
				interval: 32,
			}),
		);

		expect(result.permissionGranted.value).toBe(true);
		expect(result.interval.value).toBe(32);

		setResponse("denied");
		await result.ensurePermissions();
		window.dispatchEvent(
			createMotionEvent({
				acceleration: { x: 4, y: 5, z: 6 },
				interval: 64,
			}),
		);

		expect(result.permissionGranted.value).toBe(false);
		expect(result.acceleration.value).toEqual({ x: 1, y: 2, z: 3 });
		expect(result.interval.value).toBe(32);
		result.stop();
	});

	it("allows manual permission requests", async () => {
		const DeviceMotionEvent = createPermissionConstructor("granted");
		const window = createWindow(DeviceMotionEvent);
		const result = useDeviceMotion({ window });

		expect(result.requirePermissions.value).toBe(true);
		expect(result.permissionGranted.value).toBe(false);

		await result.ensurePermissions();
		window.dispatchEvent(
			createMotionEvent({
				rotationRate: { alpha: 1, beta: 2, gamma: 3 },
				interval: 20,
			}),
		);

		expect(result.permissionGranted.value).toBe(true);
		expect(result.rotationRate.value).toEqual({ alpha: 1, beta: 2, gamma: 3 });
		expect(result.interval.value).toBe(20);
		result.stop();
	});

	it("does not start listening when stopped before permission resolves", async () => {
		const { DeviceMotionEvent, resolvePermission } =
			createDeferredPermissionConstructor();
		const window = createWindow(DeviceMotionEvent);
		const result = useDeviceMotion({ requestPermissions: true, window });

		result.stop();
		resolvePermission("granted");
		await Promise.resolve();

		window.dispatchEvent(
			createMotionEvent({
				acceleration: { x: 1, y: 2, z: 3 },
				interval: 32,
			}),
		);

		expect(result.permissionGranted.value).toBe(false);
		expect(result.acceleration.value).toEqual({ x: null, y: null, z: null });
		expect(result.interval.value).toBe(0);
	});

	it("does not restart after stop when ensurePermissions is called", async () => {
		const window = createWindow();
		const result = useDeviceMotion({ window });

		result.stop();
		await result.ensurePermissions();
		window.dispatchEvent(
			createMotionEvent({
				acceleration: { x: 1, y: 2, z: 3 },
				interval: 32,
			}),
		);

		expect(result.acceleration.value).toEqual({ x: null, y: null, z: null });
		expect(result.interval.value).toBe(0);
	});

	it("reacts to window support changes", () => {
		const windowTarget = signal<UseDeviceMotionWindowLike | null>(null);
		const result = useDeviceMotion({ window: windowTarget });

		expect(result.isSupported.value).toBe(false);

		const firstWindow = createWindow();
		windowTarget.value = firstWindow;
		expect(result.isSupported.value).toBe(true);

		firstWindow.dispatchEvent(
			createMotionEvent({
				acceleration: { x: 1, y: 2, z: 3 },
				interval: 10,
			}),
		);
		expect(result.interval.value).toBe(10);

		windowTarget.value = null;
		expect(result.isSupported.value).toBe(false);
		expect(result.acceleration.value).toEqual({ x: null, y: null, z: null });

		firstWindow.dispatchEvent(
			createMotionEvent({
				acceleration: { x: 4, y: 5, z: 6 },
				interval: 40,
			}),
		);
		expect(result.interval.value).toBe(0);
		result.stop();
	});

	it("moves the listener when the window changes", () => {
		const firstWindow = createWindow();
		const secondWindow = createWindow();
		const windowTarget = signal<UseDeviceMotionWindowLike | null>(firstWindow);
		const result = useDeviceMotion({ window: windowTarget });

		firstWindow.dispatchEvent(
			createMotionEvent({
				acceleration: { x: 1, y: 2, z: 3 },
				interval: 10,
			}),
		);
		expect(result.interval.value).toBe(10);

		windowTarget.value = secondWindow;
		firstWindow.dispatchEvent(
			createMotionEvent({
				acceleration: { x: 4, y: 5, z: 6 },
				interval: 40,
			}),
		);
		expect(result.acceleration.value).toEqual({ x: null, y: null, z: null });
		expect(result.interval.value).toBe(0);

		secondWindow.dispatchEvent(
			createMotionEvent({
				acceleration: { x: 7, y: 8, z: 9 },
				interval: 70,
			}),
		);
		expect(result.acceleration.value).toEqual({ x: 7, y: 8, z: 9 });
		expect(result.interval.value).toBe(70);
		result.stop();
	});

	it("ignores stale permission results after the window changes", async () => {
		const firstPermission = createDeferredPermissionConstructor();
		const secondPermission = createDeferredPermissionConstructor();
		const firstWindow = createWindow(firstPermission.DeviceMotionEvent);
		const secondWindow = createWindow(secondPermission.DeviceMotionEvent);
		const windowTarget = signal<UseDeviceMotionWindowLike | null>(firstWindow);
		const result = useDeviceMotion({
			requestPermissions: true,
			window: windowTarget,
		});

		windowTarget.value = secondWindow;
		firstPermission.resolvePermission("granted");
		secondPermission.resolvePermission("granted");
		await Promise.resolve();
		await Promise.resolve();

		firstWindow.dispatchEvent(
			createMotionEvent({
				acceleration: { x: 1, y: 2, z: 3 },
				interval: 10,
			}),
		);
		expect(result.interval.value).toBe(0);

		secondWindow.dispatchEvent(
			createMotionEvent({
				acceleration: { x: 4, y: 5, z: 6 },
				interval: 40,
			}),
		);
		expect(result.permissionGranted.value).toBe(true);
		expect(result.acceleration.value).toEqual({ x: 4, y: 5, z: 6 });
		expect(result.interval.value).toBe(40);
		result.stop();
	});

	it("stops listening to devicemotion events", () => {
		const window = createWindow();
		const result = useDeviceMotion({ window });

		result.stop();
		window.dispatchEvent(
			createMotionEvent({
				acceleration: { x: 1, y: 2, z: 3 },
				interval: 10,
			}),
		);

		expect(result.acceleration.value).toEqual({ x: null, y: null, z: null });
		expect(result.interval.value).toBe(0);
	});
});
