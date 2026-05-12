import { readonly, signal, watch } from "@sigrea/core";

import { defaultWindow, listen, resolveValue } from "../../shared";
import { createEventHook } from "../createEventHook";
import { tryOnScopeDispose } from "../tryOnScopeDispose";
import type {
	MaybeValue,
	UseWebNotificationConstructorLike,
	UseWebNotificationConstructorOptions,
	UseWebNotificationNotificationLike,
	UseWebNotificationOptions,
	UseWebNotificationOptionsBase,
	UseWebNotificationReturn,
	UseWebNotificationWindowLike,
} from "../types";
import { useDocumentVisibility } from "../useDocumentVisibility";

type SupportedWebNotificationWindow<
	TNotification extends UseWebNotificationNotificationLike,
> = UseWebNotificationWindowLike<TNotification> & {
	readonly Notification: UseWebNotificationConstructorLike<TNotification>;
};

function isNotificationConstructor<
	TNotification extends UseWebNotificationNotificationLike,
>(value: unknown): value is UseWebNotificationConstructorLike<TNotification> {
	return (
		typeof value === "function" &&
		typeof (value as UseWebNotificationConstructorLike<TNotification>)
			.requestPermission === "function" &&
		typeof (value as UseWebNotificationConstructorLike<TNotification>)
			.permission === "string"
	);
}

function isNotificationWindow<
	TNotification extends UseWebNotificationNotificationLike,
>(
	window: UseWebNotificationWindowLike<TNotification> | null | undefined,
): window is SupportedWebNotificationWindow<TNotification> {
	return isNotificationConstructor<TNotification>(window?.Notification);
}

function isTypeErrorLike(error: unknown): boolean {
	return (
		error instanceof TypeError ||
		(typeof error === "object" &&
			error !== null &&
			"name" in error &&
			(error as { readonly name?: unknown }).name === "TypeError")
	);
}

function copyVibrate(
	value: number | readonly number[] | undefined,
): number | number[] | undefined {
	if (value === undefined || typeof value === "number") {
		return value;
	}

	return [...value];
}

function toNotificationOptions(
	options: UseWebNotificationOptionsBase,
): UseWebNotificationConstructorOptions {
	const notificationOptions: UseWebNotificationConstructorOptions = {};

	if (options.badge !== undefined) {
		notificationOptions.badge = options.badge;
	}
	if (options.body !== undefined) {
		notificationOptions.body = options.body;
	}
	if (options.data !== undefined) {
		notificationOptions.data = options.data;
	}
	if (options.dir !== undefined) {
		notificationOptions.dir = options.dir;
	}
	if (options.icon !== undefined) {
		notificationOptions.icon = options.icon;
	}
	if (options.image !== undefined) {
		notificationOptions.image = options.image;
	}
	if (options.lang !== undefined) {
		notificationOptions.lang = options.lang;
	}
	if (options.renotify !== undefined) {
		notificationOptions.renotify = options.renotify;
	}
	if (options.requireInteraction !== undefined) {
		notificationOptions.requireInteraction = options.requireInteraction;
	}
	if (options.silent !== undefined) {
		notificationOptions.silent = options.silent;
	}
	if (options.tag !== undefined) {
		notificationOptions.tag = options.tag;
	}
	if (options.timestamp !== undefined) {
		notificationOptions.timestamp = options.timestamp;
	}
	if (options.vibrate !== undefined) {
		notificationOptions.vibrate = copyVibrate(options.vibrate);
	}

	return notificationOptions;
}

function validateNotificationOptions(
	options: UseWebNotificationConstructorOptions,
): TypeError | undefined {
	if (options.silent === true && options.vibrate !== undefined) {
		return new TypeError("vibrate must be omitted when silent is true");
	}

	if (
		options.renotify === true &&
		(options.tag === undefined || options.tag === "")
	) {
		return new TypeError("tag must be set when renotify is true");
	}

	return undefined;
}

/**
 * Reactive Web Notifications API controls.
 */
export function useWebNotification<
	TNotification extends UseWebNotificationNotificationLike = Notification,
	TWindow extends
		UseWebNotificationWindowLike<TNotification> = UseWebNotificationWindowLike<TNotification>,
>(
	options: UseWebNotificationOptions<TNotification, TWindow> = {},
): UseWebNotificationReturn<TNotification> {
	const windowTarget: MaybeValue<TWindow | null | undefined> =
		"window" in options
			? options.window
			: (defaultWindow as TWindow | undefined);
	const requestPermissions = options.requestPermissions ?? false;
	const notification = signal<TNotification | null>(null);
	const isSupported = signal(false);
	const permissionGranted = signal(false);
	const error = signal<unknown | null>(null);
	const clickHook = createEventHook<Event>();
	const showHook = createEventHook<Event>();
	const errorHook = createEventHook<Event>();
	const closeHook = createEventHook<Event>();
	const currentWindow = () => resolveValue(windowTarget);
	const documentVisibility = useDocumentVisibility({
		document: () => currentWindow()?.document ?? null,
	});
	let stopNotificationListeners = () => {};
	let releaseNotificationListenersForClose = () => {};
	const pendingCloseListenerCleanups = new Set<() => void>();
	let constructorSupported = true;
	let stopped = false;

	const syncState = () => {
		const window = currentWindow();
		if (!constructorSupported || !isNotificationWindow(window)) {
			isSupported.value = false;
			permissionGranted.value = false;
			return;
		}

		isSupported.value = true;
		permissionGranted.value = window.Notification.permission === "granted";
	};
	const cleanupNotificationListeners = () => {
		stopNotificationListeners();
		stopNotificationListeners = () => {};
		releaseNotificationListenersForClose = () => {};
	};
	const cleanupPendingCloseListeners = () => {
		for (const cleanup of pendingCloseListenerCleanups) {
			cleanup();
		}
		pendingCloseListenerCleanups.clear();
	};
	const setNotification = (nextNotification: TNotification) => {
		cleanupNotificationListeners();
		notification.value = nextNotification;
		const stopClick = listen(
			nextNotification,
			"click",
			(event) => {
				void clickHook.trigger(event);
			},
			{ passive: true },
		);
		const stopShow = listen(
			nextNotification,
			"show",
			(event) => {
				void showHook.trigger(event);
			},
			{ passive: true },
		);
		const stopError = listen(
			nextNotification,
			"error",
			(event) => {
				error.value = event;
				void errorHook.trigger(event);
			},
			{ passive: true },
		);
		let stopClose = () => {};
		let stoppedPassiveListeners = false;
		let stoppedAllListeners = false;
		const stopPassiveListeners = () => {
			if (stoppedPassiveListeners) {
				return;
			}

			stoppedPassiveListeners = true;
			stopClick();
			stopShow();
			stopError();
		};
		const stopAllListeners = () => {
			if (stoppedAllListeners) {
				return;
			}

			stoppedAllListeners = true;
			stopPassiveListeners();
			stopClose();
			pendingCloseListenerCleanups.delete(stopAllListeners);
		};
		stopClose = listen(
			nextNotification,
			"close",
			(event) => {
				if (notification.value === nextNotification) {
					notification.value = null;
					if (stopNotificationListeners === stopAllListeners) {
						stopNotificationListeners = () => {};
						releaseNotificationListenersForClose = () => {};
					}
				}
				stopAllListeners();
				void closeHook.trigger(event);
			},
			{ passive: true },
		);
		stopNotificationListeners = stopAllListeners;
		releaseNotificationListenersForClose = () => {
			stopPassiveListeners();
			if (!stoppedAllListeners) {
				pendingCloseListenerCleanups.add(stopAllListeners);
			}
			if (stopNotificationListeners === stopAllListeners) {
				stopNotificationListeners = () => {};
				releaseNotificationListenersForClose = () => {};
			}
		};
	};

	const ensurePermissions = async (): Promise<boolean> => {
		if (stopped) {
			return false;
		}

		const window = currentWindow();
		if (!constructorSupported || !isNotificationWindow(window)) {
			syncState();
			return false;
		}

		const Notification = window.Notification;
		if (Notification.permission === "granted") {
			error.value = null;
			permissionGranted.value = true;
			isSupported.value = true;
			return true;
		}
		if (Notification.permission === "denied") {
			error.value = null;
			permissionGranted.value = false;
			isSupported.value = true;
			return false;
		}

		try {
			const result = await Notification.requestPermission();
			if (stopped || currentWindow()?.Notification !== Notification) {
				return false;
			}

			error.value = null;
			isSupported.value = true;
			permissionGranted.value = result === "granted";
			return permissionGranted.value;
		} catch (requestError) {
			if (!stopped && currentWindow()?.Notification === Notification) {
				error.value = requestError;
				isSupported.value = true;
				permissionGranted.value = false;
			}
			return false;
		}
	};

	const show = async (
		overrides: UseWebNotificationOptionsBase = {},
	): Promise<TNotification | undefined> => {
		if (stopped) {
			return undefined;
		}

		syncState();
		const window = currentWindow();
		if (!isNotificationWindow(window) || !permissionGranted.value) {
			return undefined;
		}

		const merged = {
			...options,
			...overrides,
		};
		const notificationOptions = toNotificationOptions(merged);
		const validationError = validateNotificationOptions(notificationOptions);
		if (validationError !== undefined) {
			error.value = validationError;
			return undefined;
		}

		try {
			const nextNotification = new window.Notification(
				merged.title ?? "",
				notificationOptions,
			);
			if (stopped || currentWindow() !== window) {
				nextNotification.close();
				return undefined;
			}

			close();
			error.value = null;
			setNotification(nextNotification);
			return nextNotification;
		} catch (constructorError) {
			error.value = constructorError;
			if (isTypeErrorLike(constructorError)) {
				constructorSupported = false;
				isSupported.value = false;
				permissionGranted.value = false;
			}
			return undefined;
		}
	};

	const close = (): void => {
		const currentNotification = notification.value;
		if (currentNotification === null) {
			cleanupNotificationListeners();
			return;
		}

		try {
			currentNotification.close();
		} finally {
			if (notification.value === currentNotification) {
				notification.value = null;
			}
			releaseNotificationListenersForClose();
		}
	};

	const stopWindowWatch = watch(
		currentWindow,
		(window, previousWindow) => {
			if (previousWindow !== undefined && window !== previousWindow) {
				constructorSupported = true;
				close();
			}
			syncState();
		},
		{ immediate: true, flush: "sync" },
	);
	const stopPermissionWatch = watch(
		() => resolveValue(requestPermissions),
		(enabled) => {
			if (enabled) {
				void ensurePermissions();
			}
		},
		{ immediate: true, flush: "sync" },
	);
	const stopVisibilityWatch = watch(
		() => documentVisibility.visibility.value,
		(visibility) => {
			if (visibility === "visible") {
				close();
			}
		},
		{ flush: "sync" },
	);

	const stop = (): void => {
		if (stopped) {
			return;
		}

		stopped = true;
		stopWindowWatch();
		stopPermissionWatch();
		stopVisibilityWatch();
		documentVisibility.stop();
		close();
		cleanupNotificationListeners();
		cleanupPendingCloseListeners();
		clickHook.clear();
		showHook.clear();
		errorHook.clear();
		closeHook.clear();
	};

	tryOnScopeDispose(stop);

	return {
		notification: readonly(notification),
		isSupported: readonly(isSupported),
		permissionGranted: readonly(permissionGranted),
		error: readonly(error),
		ensurePermissions,
		show,
		close,
		onClick: clickHook.on,
		onShow: showHook.on,
		onError: errorHook.on,
		onClose: closeHook.on,
		stop,
	};
}
