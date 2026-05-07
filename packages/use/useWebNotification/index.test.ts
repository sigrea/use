import { createScope, disposeScope, runWithScope, signal } from "@sigrea/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import type {
	UseWebNotificationConstructorLike,
	UseWebNotificationConstructorOptions,
	UseWebNotificationNotificationLike,
	UseWebNotificationOptions,
	UseWebNotificationWindowLike,
} from "../types";
import { useWebNotification } from "./index";

class FakeDocument extends EventTarget {
	visibilityState: DocumentVisibilityState;

	constructor(visibilityState: DocumentVisibilityState = "visible") {
		super();
		this.visibilityState = visibilityState;
	}

	setVisibility(visibilityState: DocumentVisibilityState): void {
		this.visibilityState = visibilityState;
		this.dispatchEvent(new Event("visibilitychange"));
	}
}

class FakeNotification
	extends EventTarget
	implements UseWebNotificationNotificationLike
{
	static permission: NotificationPermission = "default";
	static requestResult: NotificationPermission = "granted";
	static instances: FakeNotification[] = [];
	static constructorError: unknown;
	static requestPermission = vi.fn(async function (
		this: typeof FakeNotification,
	) {
		this.permission = this.requestResult;
		return this.requestResult;
	});

	readonly close = vi.fn(() => {
		this.dispatchEvent(new Event("close"));
	});

	constructor(
		readonly title: string,
		readonly options?: UseWebNotificationConstructorOptions,
	) {
		super();
		const notificationClass = this.constructor as typeof FakeNotification;
		if (notificationClass.constructorError !== undefined) {
			throw notificationClass.constructorError;
		}

		notificationClass.instances.push(this);
	}
}

class FakeWindow
	extends EventTarget
	implements UseWebNotificationWindowLike<FakeNotification>
{
	constructor(
		readonly document: FakeDocument | undefined = new FakeDocument(),
		readonly Notification: UseWebNotificationConstructorLike<FakeNotification> | null = FakeNotification,
	) {
		super();
	}
}

function resetNotification(
	notificationClass: typeof FakeNotification = FakeNotification,
): void {
	notificationClass.permission = "default";
	notificationClass.requestResult = "granted";
	notificationClass.instances = [];
	notificationClass.constructorError = undefined;
	notificationClass.requestPermission.mockClear();
}

function useFakeWebNotification(
	options: UseWebNotificationOptions<FakeNotification, FakeWindow> = {},
) {
	return useWebNotification<FakeNotification, FakeWindow>(options);
}

describe("useWebNotification", () => {
	afterEach(() => {
		resetNotification();
	});

	it("stays safe without Notification support", async () => {
		const result = useFakeWebNotification({ window: null });

		expect(result.isSupported.value).toBe(false);
		expect(result.permissionGranted.value).toBe(false);
		expect(result.error.value).toBeNull();
		expect(result.notification.value).toBeNull();
		await expect(result.ensurePermissions()).resolves.toBe(false);
		await expect(result.show()).resolves.toBeUndefined();

		result.close();
		result.stop();
	});

	it("requests permission only through ensurePermissions", async () => {
		const window = new FakeWindow();
		const result = useFakeWebNotification({ window });

		expect(result.isSupported.value).toBe(true);
		expect(result.permissionGranted.value).toBe(false);
		await expect(result.show()).resolves.toBeUndefined();
		expect(FakeNotification.requestPermission).not.toHaveBeenCalled();

		await expect(result.ensurePermissions()).resolves.toBe(true);

		expect(FakeNotification.requestPermission).toHaveBeenCalledOnce();
		expect(result.permissionGranted.value).toBe(true);
		expect(result.error.value).toBeNull();
		await expect(result.show()).resolves.toBeInstanceOf(FakeNotification);
	});

	it("returns false when permission is denied", async () => {
		FakeNotification.requestResult = "denied";
		const result = useFakeWebNotification({ window: new FakeWindow() });

		await expect(result.ensurePermissions()).resolves.toBe(false);

		expect(result.permissionGranted.value).toBe(false);
		await expect(result.show()).resolves.toBeUndefined();
	});

	it("stores permission request errors", async () => {
		const requestError = new DOMException("blocked", "NotAllowedError");
		FakeNotification.requestPermission.mockRejectedValueOnce(requestError);
		const result = useFakeWebNotification({ window: new FakeWindow() });

		await expect(result.ensurePermissions()).resolves.toBe(false);

		expect(result.permissionGranted.value).toBe(false);
		expect(result.error.value).toBe(requestError);
	});

	it("uses notification options and copies readonly arrays", async () => {
		FakeNotification.permission = "granted";
		const vibrate = [100, 50, 100] as const;
		const result = useFakeWebNotification({
			body: "base body",
			title: "Base title",
			vibrate,
			window: new FakeWindow(),
		});

		const notification = await result.show({
			body: "override body",
			tag: "message",
			title: "Override title",
		});

		expect(notification).toBe(FakeNotification.instances[0]);
		expect(notification?.title).toBe("Override title");
		expect(notification?.options).toMatchObject({
			body: "override body",
			tag: "message",
		});
		expect(notification?.options?.vibrate).toEqual(vibrate);
		expect(notification?.options?.vibrate).not.toBe(vibrate);
	});

	it("returns undefined when the Notification constructor throws", async () => {
		FakeNotification.permission = "granted";
		FakeNotification.constructorError = new TypeError("Illegal constructor");
		const result = useFakeWebNotification({ window: new FakeWindow() });

		await expect(result.show()).resolves.toBeUndefined();

		expect(result.notification.value).toBeNull();
		expect(result.error.value).toBeInstanceOf(TypeError);
		expect(result.isSupported.value).toBe(false);
		expect(result.permissionGranted.value).toBe(false);
		await expect(result.ensurePermissions()).resolves.toBe(false);
	});

	it("treats TypeError-like constructor errors as unsupported", async () => {
		FakeNotification.permission = "granted";
		const constructorError = Object.assign(new Error("Illegal constructor"), {
			name: "TypeError",
		});
		FakeNotification.constructorError = constructorError;
		const result = useFakeWebNotification({ window: new FakeWindow() });

		await expect(result.show()).resolves.toBeUndefined();

		expect(result.error.value).toBe(constructorError);
		expect(result.isSupported.value).toBe(false);
		expect(result.permissionGranted.value).toBe(false);
	});

	it("keeps constructor support after invalid notification options", async () => {
		FakeNotification.permission = "granted";
		const result = useFakeWebNotification({ window: new FakeWindow() });

		await expect(
			result.show({
				silent: true,
				vibrate: [100],
			}),
		).resolves.toBeUndefined();

		expect(result.error.value).toBeInstanceOf(TypeError);
		expect(result.isSupported.value).toBe(true);
		expect(result.permissionGranted.value).toBe(true);
		expect(FakeNotification.instances).toHaveLength(0);

		await expect(result.show({ title: "Valid" })).resolves.toBeInstanceOf(
			FakeNotification,
		);
		expect(result.error.value).toBeNull();
	});

	it("provides notification event hooks", async () => {
		FakeNotification.permission = "granted";
		const result = useFakeWebNotification({ window: new FakeWindow() });
		const onClick = vi.fn();
		const onShow = vi.fn();
		const onError = vi.fn();
		const onClose = vi.fn();
		result.onClick(onClick);
		result.onShow(onShow);
		result.onError(onError);
		result.onClose(onClose);

		const notification = await result.show();
		if (notification === undefined) {
			throw new Error("notification was not created");
		}

		notification.dispatchEvent(new Event("click"));
		notification.dispatchEvent(new Event("show"));
		notification.dispatchEvent(new Event("error"));
		notification.dispatchEvent(new Event("close"));

		await vi.waitFor(() => {
			expect(onClick).toHaveBeenCalledOnce();
			expect(onShow).toHaveBeenCalledOnce();
			expect(onError).toHaveBeenCalledOnce();
			expect(onClose).toHaveBeenCalledOnce();
		});
		expect(result.error.value).toBeInstanceOf(Event);
		expect(result.notification.value).toBeNull();
	});

	it("closes the active notification", async () => {
		FakeNotification.permission = "granted";
		const result = useFakeWebNotification({ window: new FakeWindow() });
		const onClose = vi.fn();
		result.onClose(onClose);
		const notification = await result.show();
		if (notification === undefined) {
			throw new Error("notification was not created");
		}

		result.close();

		expect(notification.close).toHaveBeenCalledOnce();
		await vi.waitFor(() => {
			expect(onClose).toHaveBeenCalledOnce();
		});
		expect(result.notification.value).toBeNull();
	});

	it("closes stale notification when the document becomes visible", async () => {
		FakeNotification.permission = "granted";
		const document = new FakeDocument("hidden");
		const result = useFakeWebNotification({
			window: new FakeWindow(document),
		});
		const notification = await result.show();
		if (notification === undefined) {
			throw new Error("notification was not created");
		}

		document.setVisibility("visible");

		await vi.waitFor(() => {
			expect(notification.close).toHaveBeenCalledOnce();
		});
		expect(result.notification.value).toBeNull();
	});

	it("updates support and creation target when the window signal changes", async () => {
		class FirstNotification extends FakeNotification {
			static override permission: NotificationPermission = "granted";
			static override instances: FakeNotification[] = [];
		}
		class SecondNotification extends FakeNotification {
			static override permission: NotificationPermission = "granted";
			static override instances: FakeNotification[] = [];
		}
		resetNotification(FirstNotification);
		resetNotification(SecondNotification);
		FirstNotification.permission = "granted";
		SecondNotification.permission = "granted";
		const firstWindow = new FakeWindow(new FakeDocument(), FirstNotification);
		const secondWindow = new FakeWindow(new FakeDocument(), SecondNotification);
		const window = signal<FakeWindow | null>(null);
		const result = useFakeWebNotification({ window });

		expect(result.isSupported.value).toBe(false);

		window.value = firstWindow;
		expect(result.isSupported.value).toBe(true);
		await result.show();
		expect(FirstNotification.instances).toHaveLength(1);

		window.value = secondWindow;
		await result.show();

		expect(FirstNotification.instances[0]?.close).toHaveBeenCalledOnce();
		expect(SecondNotification.instances).toHaveLength(1);

		window.value = null;
		expect(result.isSupported.value).toBe(false);
		expect(SecondNotification.instances[0]?.close).toHaveBeenCalledOnce();
	});

	it("can request permission from a reactive requestPermissions option", async () => {
		const requestPermissions = signal(false);
		const result = useFakeWebNotification({
			requestPermissions,
			window: new FakeWindow(),
		});

		expect(FakeNotification.requestPermission).not.toHaveBeenCalled();

		requestPermissions.value = true;

		await vi.waitFor(() => {
			expect(FakeNotification.requestPermission).toHaveBeenCalledOnce();
		});
		expect(result.permissionGranted.value).toBe(true);
		result.stop();
	});

	it("stops watchers and closes notification on scope disposal", async () => {
		FakeNotification.permission = "granted";
		const document = new FakeDocument("hidden");
		const scope = createScope();
		const result = runWithScope(scope, () =>
			useFakeWebNotification({
				window: new FakeWindow(document),
			}),
		);
		if (result === undefined) {
			throw new Error("scope did not return a result");
		}
		const notification = await result.show();
		if (notification === undefined) {
			throw new Error("notification was not created");
		}

		disposeScope(scope);
		document.setVisibility("visible");

		expect(notification.close).toHaveBeenCalledOnce();
		expect(result.notification.value).toBeNull();
	});
});
