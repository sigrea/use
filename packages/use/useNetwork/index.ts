import { readonly, signal, watch } from "@sigrea/core";

import {
	defaultWindow,
	listen,
	resolveTarget,
	resolveValue,
} from "../../shared";
import type {
	MaybeTarget,
	MaybeValue,
	UseNetworkConnectionLike,
	UseNetworkEffectiveType,
	UseNetworkNavigatorLike,
	UseNetworkOptions,
	UseNetworkReturn,
	UseNetworkType,
	WindowLike,
} from "../types";

function readOnline(
	navigator: UseNetworkNavigatorLike | null | undefined,
): boolean {
	return navigator?.onLine ?? true;
}

function supportsConnection(
	navigator: UseNetworkNavigatorLike | null | undefined,
): boolean {
	return (
		navigator !== null && navigator !== undefined && "connection" in navigator
	);
}

function readConnection(
	navigator: UseNetworkNavigatorLike | null | undefined,
): UseNetworkConnectionLike | null | undefined {
	return navigator?.connection;
}

export function useNetwork<
	TWindow extends WindowLike = WindowLike,
	TNavigator extends UseNetworkNavigatorLike = UseNetworkNavigatorLike,
>(options: UseNetworkOptions<TWindow, TNavigator> = {}): UseNetworkReturn {
	const windowTarget =
		"window" in options && options.window !== undefined
			? options.window
			: (defaultWindow as MaybeTarget<TWindow> | undefined);
	const navigatorTarget: MaybeValue<TNavigator | null | undefined> =
		"navigator" in options ? options.navigator : undefined;
	const isSupported = signal(false);
	const isOnline = signal(true);
	const offlineAt = signal<number | undefined>(undefined);
	const onlineAt = signal<number | undefined>(undefined);
	const downlink = signal<number | undefined>(undefined);
	const downlinkMax = signal<number | undefined>(undefined);
	const effectiveType = signal<UseNetworkEffectiveType | undefined>(undefined);
	const rtt = signal<number | undefined>(undefined);
	const saveData = signal<boolean | undefined>(false);
	const type = signal<UseNetworkType>("unknown");

	const currentWindow = () =>
		windowTarget === undefined
			? undefined
			: resolveTarget<TWindow | null | undefined>(windowTarget);
	const currentNavigator = (windowValue: TWindow | null | undefined) => {
		const navigator = resolveValue(navigatorTarget);

		return navigator === undefined
			? (windowValue?.navigator as TNavigator | null | undefined)
			: navigator;
	};
	const resetConnectionInfo = (): void => {
		downlink.value = undefined;
		downlinkMax.value = undefined;
		effectiveType.value = undefined;
		rtt.value = undefined;
		saveData.value = false;
		type.value = "unknown";
	};
	const syncNetworkInfo = (navigator: TNavigator | null | undefined): void => {
		if (navigator === null || navigator === undefined) {
			isOnline.value = true;
			offlineAt.value = undefined;
			onlineAt.value = undefined;
			isSupported.value = false;
			resetConnectionInfo();
			return;
		}

		const online = readOnline(navigator);
		const connection = readConnection(navigator);

		isOnline.value = online;
		offlineAt.value = online ? undefined : Date.now();
		onlineAt.value = online ? Date.now() : undefined;
		isSupported.value = supportsConnection(navigator);

		if (!connection) {
			resetConnectionInfo();
			return;
		}

		downlink.value = connection.downlink;
		downlinkMax.value = connection.downlinkMax;
		effectiveType.value = connection.effectiveType;
		rtt.value = connection.rtt;
		saveData.value = connection.saveData;
		type.value = connection.type ?? "unknown";
	};
	const stop = watch(
		() => {
			const windowValue = currentWindow();
			const navigator = currentNavigator(windowValue);

			return {
				connection: readConnection(navigator),
				navigator,
				window: windowValue,
			};
		},
		({ connection, navigator, window }, _previousValue, onCleanup) => {
			syncNetworkInfo(navigator);

			const cleanups: Array<() => void> = [];

			if (window) {
				const syncOnline = () => {
					syncNetworkInfo(navigator);
				};

				cleanups.push(
					listen(window, "online", syncOnline, { passive: true }),
					listen(window, "offline", syncOnline, { passive: true }),
				);
			}

			if (connection) {
				cleanups.push(
					listen(
						connection,
						"change",
						() => {
							syncNetworkInfo(navigator);
						},
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
		isSupported: readonly(isSupported),
		isOnline: readonly(isOnline),
		offlineAt: readonly(offlineAt),
		onlineAt: readonly(onlineAt),
		downlink: readonly(downlink),
		downlinkMax: readonly(downlinkMax),
		effectiveType: readonly(effectiveType),
		rtt: readonly(rtt),
		saveData: readonly(saveData),
		type: readonly(type),
		stop,
	};
}
