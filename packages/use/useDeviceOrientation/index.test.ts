import { signal } from "@sigrea/core";
import { describe, expect, it, vi } from "vitest";

import type {
	DeviceOrientationEventConstructorLike,
	DeviceOrientationPermissionState,
	UseDeviceOrientationWindowLike,
} from "../types";
import { useDeviceOrientation } from "./index";

class FakeDeviceOrientationEvent
	extends Event
	implements DeviceOrientationEvent
{
	readonly absolute: boolean;
	readonly alpha: number | null;
	readonly beta: number | null;
	readonly gamma: number | null;

	constructor(type: string, init: DeviceOrientationEventInit = {}) {
		super(type, init);
		this.absolute = init.absolute ?? false;
		this.alpha = init.alpha ?? null;
		this.beta = init.beta ?? null;
		this.gamma = init.gamma ?? null;
	}
}

class FakeWindow extends EventTarget implements UseDeviceOrientationWindowLike {
	constructor(
		readonly DeviceOrientationEvent?: DeviceOrientationEventConstructorLike,
	) {
		super();
	}
}

function createWindow(
	eventConstructor: DeviceOrientationEventConstructorLike = FakeDeviceOrientationEvent,
): UseDeviceOrientationWindowLike {
	return new FakeWindow(eventConstructor);
}

function createOrientationEvent(
	init: DeviceOrientationEventInit = {},
): DeviceOrientationEvent {
	return new FakeDeviceOrientationEvent("deviceorientation", init);
}

function createAbsoluteOrientationEvent(
	init: DeviceOrientationEventInit = {},
): DeviceOrientationEvent {
	return new FakeDeviceOrientationEvent("deviceorientationabsolute", {
		absolute: true,
		...init,
	});
}

function createPermissionConstructor(
	response:
		| DeviceOrientationPermissionState
		| Promise<DeviceOrientationPermissionState>,
): DeviceOrientationEventConstructorLike {
	return class PermissionDeviceOrientationEvent extends FakeDeviceOrientationEvent {
		static requestPermission = vi.fn((absolute?: boolean) =>
			Promise.resolve(response),
		);
	};
}

function createMutablePermissionConstructor(
	initialResponse: DeviceOrientationPermissionState,
) {
	let response = initialResponse;
	const DeviceOrientationEvent = class PermissionDeviceOrientationEvent extends FakeDeviceOrientationEvent {
		static requestPermission = vi.fn((absolute?: boolean) =>
			Promise.resolve(response),
		);
	};

	return {
		DeviceOrientationEvent,
		setResponse(nextResponse: DeviceOrientationPermissionState) {
			response = nextResponse;
		},
	};
}

function createDeferredPermissionConstructor() {
	let resolvePermission!: (value: DeviceOrientationPermissionState) => void;
	const permission = new Promise<DeviceOrientationPermissionState>(
		(resolve) => {
			resolvePermission = resolve;
		},
	);
	const DeviceOrientationEvent = class PermissionDeviceOrientationEvent extends FakeDeviceOrientationEvent {
		static requestPermission = vi.fn((absolute?: boolean) => permission);
	};

	return { DeviceOrientationEvent, resolvePermission };
}

describe("useDeviceOrientation", () => {
	it("uses fallback values without DeviceOrientationEvent support", async () => {
		const result = useDeviceOrientation({ window: null });

		expect(result.isSupported.value).toBe(false);
		expect(result.requirePermissions.value).toBe(false);
		expect(result.permissionGranted.value).toBe(false);
		expect(result.isAbsolute.value).toBe(false);
		expect(result.alpha.value).toBeNull();
		expect(result.beta.value).toBeNull();
		expect(result.gamma.value).toBeNull();

		await result.ensurePermissions();
		result.stop();
	});

	it("updates orientation values from deviceorientation events", () => {
		const window = createWindow();
		const result = useDeviceOrientation({ window });

		window.dispatchEvent(
			createOrientationEvent({
				absolute: true,
				alpha: 10,
				beta: 20,
				gamma: -30,
			}),
		);

		expect(result.isSupported.value).toBe(true);
		expect(result.isAbsolute.value).toBe(true);
		expect(result.alpha.value).toBe(10);
		expect(result.beta.value).toBe(20);
		expect(result.gamma.value).toBe(-30);
		result.stop();
	});

	it("keeps zero orientation values", () => {
		const window = createWindow();
		const result = useDeviceOrientation({ window });

		window.dispatchEvent(
			createOrientationEvent({
				alpha: 0,
				beta: 0,
				gamma: 0,
			}),
		);

		expect(result.alpha.value).toBe(0);
		expect(result.beta.value).toBe(0);
		expect(result.gamma.value).toBe(0);
		result.stop();
	});

	it("resets missing event fields to fallback values", () => {
		const window = createWindow();
		const result = useDeviceOrientation({ window });

		window.dispatchEvent(createOrientationEvent());

		expect(result.isAbsolute.value).toBe(false);
		expect(result.alpha.value).toBeNull();
		expect(result.beta.value).toBeNull();
		expect(result.gamma.value).toBeNull();
		result.stop();
	});

	it("treats non-constructor DeviceOrientationEvent values as unsupported", () => {
		const window = createWindow(
			{} as unknown as DeviceOrientationEventConstructorLike,
		);
		const result = useDeviceOrientation({ window });

		expect(result.isSupported.value).toBe(false);
		expect(result.requirePermissions.value).toBe(false);
		expect(result.alpha.value).toBeNull();
		result.stop();
	});

	it("requests permission before listening when configured", async () => {
		const DeviceOrientationEvent = createPermissionConstructor("granted");
		const window = createWindow(DeviceOrientationEvent);
		const result = useDeviceOrientation({
			absolute: true,
			requestPermissions: true,
			window,
		});

		expect(result.isSupported.value).toBe(true);
		expect(result.requirePermissions.value).toBe(true);
		expect(result.permissionGranted.value).toBe(false);

		await vi.waitFor(() => {
			expect(result.permissionGranted.value).toBe(true);
		});

		window.dispatchEvent(
			createOrientationEvent({
				alpha: 1,
				beta: 2,
				gamma: 3,
			}),
		);
		expect(result.alpha.value).toBeNull();

		window.dispatchEvent(
			createAbsoluteOrientationEvent({
				alpha: 4,
				beta: 5,
				gamma: 6,
			}),
		);

		expect(result.isAbsolute.value).toBe(true);
		expect(result.alpha.value).toBe(4);
		expect(result.beta.value).toBe(5);
		expect(result.gamma.value).toBe(6);
		expect(DeviceOrientationEvent.requestPermission).toHaveBeenCalledOnce();
		expect(DeviceOrientationEvent.requestPermission).toHaveBeenCalledWith(true);
		result.stop();
	});

	it("keeps fallback values when permission is denied", async () => {
		const DeviceOrientationEvent = createPermissionConstructor("denied");
		const window = createWindow(DeviceOrientationEvent);
		const result = useDeviceOrientation({
			requestPermissions: true,
			window,
		});

		await Promise.resolve();
		window.dispatchEvent(
			createOrientationEvent({
				alpha: 1,
				beta: 2,
				gamma: 3,
			}),
		);

		expect(result.permissionGranted.value).toBe(false);
		expect(result.alpha.value).toBeNull();
		expect(result.beta.value).toBeNull();
		expect(result.gamma.value).toBeNull();
		result.stop();
	});

	it("keeps fallback values when permission rejects", async () => {
		const DeviceOrientationEvent = class PermissionDeviceOrientationEvent extends FakeDeviceOrientationEvent {
			static requestPermission = vi.fn(() =>
				Promise.reject(new Error("permission failed")),
			);
		};
		const window = createWindow(DeviceOrientationEvent);
		const result = useDeviceOrientation({
			requestPermissions: true,
			window,
		});

		await Promise.resolve();
		await Promise.resolve();
		window.dispatchEvent(
			createOrientationEvent({
				alpha: 1,
				beta: 2,
				gamma: 3,
			}),
		);

		expect(result.permissionGranted.value).toBe(false);
		expect(result.alpha.value).toBeNull();
		result.stop();
	});

	it("clears a granted listener when permission is later denied", async () => {
		const { DeviceOrientationEvent, setResponse } =
			createMutablePermissionConstructor("granted");
		const window = createWindow(DeviceOrientationEvent);
		const result = useDeviceOrientation({ window });

		await result.ensurePermissions();
		window.dispatchEvent(
			createOrientationEvent({
				alpha: 1,
				beta: 2,
				gamma: 3,
			}),
		);

		expect(result.permissionGranted.value).toBe(true);
		expect(result.alpha.value).toBe(1);

		setResponse("denied");
		await result.ensurePermissions();
		window.dispatchEvent(
			createOrientationEvent({
				alpha: 4,
				beta: 5,
				gamma: 6,
			}),
		);

		expect(result.permissionGranted.value).toBe(false);
		expect(result.alpha.value).toBe(1);
		expect(result.beta.value).toBe(2);
		expect(result.gamma.value).toBe(3);
		result.stop();
	});

	it("allows manual permission requests", async () => {
		const DeviceOrientationEvent = createPermissionConstructor("granted");
		const window = createWindow(DeviceOrientationEvent);
		const result = useDeviceOrientation({ window });

		expect(result.requirePermissions.value).toBe(true);
		expect(result.permissionGranted.value).toBe(false);

		await result.ensurePermissions(true);
		window.dispatchEvent(
			createAbsoluteOrientationEvent({
				absolute: true,
				alpha: 1,
				beta: 2,
				gamma: 3,
			}),
		);

		expect(result.permissionGranted.value).toBe(true);
		expect(result.isAbsolute.value).toBe(true);
		expect(result.gamma.value).toBe(3);
		expect(DeviceOrientationEvent.requestPermission).toHaveBeenCalledWith(true);
		result.stop();
	});

	it("switches to absolute orientation events after an absolute permission request", async () => {
		const DeviceOrientationEvent = createPermissionConstructor("granted");
		const window = createWindow(DeviceOrientationEvent);
		const result = useDeviceOrientation({ window });

		window.dispatchEvent(
			createOrientationEvent({
				alpha: 1,
				beta: 2,
				gamma: 3,
			}),
		);
		expect(result.alpha.value).toBe(1);

		await result.ensurePermissions(true);
		window.dispatchEvent(
			createOrientationEvent({
				alpha: 4,
				beta: 5,
				gamma: 6,
			}),
		);
		expect(result.alpha.value).toBe(1);

		window.dispatchEvent(
			createAbsoluteOrientationEvent({
				alpha: 7,
				beta: 8,
				gamma: 9,
			}),
		);
		expect(result.isAbsolute.value).toBe(true);
		expect(result.alpha.value).toBe(7);
		expect(result.beta.value).toBe(8);
		expect(result.gamma.value).toBe(9);
		result.stop();
	});

	it("does not start listening when stopped before permission resolves", async () => {
		const { DeviceOrientationEvent, resolvePermission } =
			createDeferredPermissionConstructor();
		const window = createWindow(DeviceOrientationEvent);
		const result = useDeviceOrientation({
			requestPermissions: true,
			window,
		});

		result.stop();
		resolvePermission("granted");
		await Promise.resolve();

		window.dispatchEvent(
			createOrientationEvent({
				alpha: 1,
				beta: 2,
				gamma: 3,
			}),
		);

		expect(result.permissionGranted.value).toBe(false);
		expect(result.alpha.value).toBeNull();
	});

	it("does not restart after stop when ensurePermissions is called", async () => {
		const window = createWindow();
		const result = useDeviceOrientation({ window });

		result.stop();
		await result.ensurePermissions();
		window.dispatchEvent(
			createOrientationEvent({
				alpha: 1,
				beta: 2,
				gamma: 3,
			}),
		);

		expect(result.alpha.value).toBeNull();
	});

	it("reacts to window support changes", () => {
		const windowTarget = signal<UseDeviceOrientationWindowLike | null>(null);
		const result = useDeviceOrientation({ window: windowTarget });

		expect(result.isSupported.value).toBe(false);

		const firstWindow = createWindow();
		windowTarget.value = firstWindow;
		expect(result.isSupported.value).toBe(true);

		firstWindow.dispatchEvent(
			createOrientationEvent({
				alpha: 1,
				beta: 2,
				gamma: 3,
			}),
		);
		expect(result.alpha.value).toBe(1);

		windowTarget.value = null;
		expect(result.isSupported.value).toBe(false);
		expect(result.alpha.value).toBeNull();

		firstWindow.dispatchEvent(
			createOrientationEvent({
				alpha: 4,
				beta: 5,
				gamma: 6,
			}),
		);
		expect(result.alpha.value).toBeNull();
		result.stop();
	});

	it("moves the listener when the window changes", () => {
		const firstWindow = createWindow();
		const secondWindow = createWindow();
		const windowTarget = signal<UseDeviceOrientationWindowLike | null>(
			firstWindow,
		);
		const result = useDeviceOrientation({ window: windowTarget });

		firstWindow.dispatchEvent(
			createOrientationEvent({
				alpha: 1,
				beta: 2,
				gamma: 3,
			}),
		);
		expect(result.alpha.value).toBe(1);

		windowTarget.value = secondWindow;
		firstWindow.dispatchEvent(
			createOrientationEvent({
				alpha: 4,
				beta: 5,
				gamma: 6,
			}),
		);
		expect(result.alpha.value).toBeNull();

		secondWindow.dispatchEvent(
			createOrientationEvent({
				alpha: 7,
				beta: 8,
				gamma: 9,
			}),
		);
		expect(result.alpha.value).toBe(7);
		expect(result.beta.value).toBe(8);
		expect(result.gamma.value).toBe(9);
		result.stop();
	});

	it("ignores stale permission results after the window changes", async () => {
		const firstPermission = createDeferredPermissionConstructor();
		const secondPermission = createDeferredPermissionConstructor();
		const firstWindow = createWindow(firstPermission.DeviceOrientationEvent);
		const secondWindow = createWindow(secondPermission.DeviceOrientationEvent);
		const windowTarget = signal<UseDeviceOrientationWindowLike | null>(
			firstWindow,
		);
		const result = useDeviceOrientation({
			requestPermissions: true,
			window: windowTarget,
		});

		windowTarget.value = secondWindow;
		firstPermission.resolvePermission("granted");
		secondPermission.resolvePermission("granted");
		await Promise.resolve();
		await Promise.resolve();

		firstWindow.dispatchEvent(
			createOrientationEvent({
				alpha: 1,
				beta: 2,
				gamma: 3,
			}),
		);
		expect(result.alpha.value).toBeNull();

		secondWindow.dispatchEvent(
			createOrientationEvent({
				alpha: 4,
				beta: 5,
				gamma: 6,
			}),
		);
		expect(result.permissionGranted.value).toBe(true);
		expect(result.alpha.value).toBe(4);
		expect(result.beta.value).toBe(5);
		expect(result.gamma.value).toBe(6);
		result.stop();
	});

	it("stops listening to deviceorientation events", () => {
		const window = createWindow();
		const result = useDeviceOrientation({ window });

		result.stop();
		window.dispatchEvent(
			createOrientationEvent({
				alpha: 1,
				beta: 2,
				gamma: 3,
			}),
		);

		expect(result.alpha.value).toBeNull();
	});
});
