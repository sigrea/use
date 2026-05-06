import { readonly, signal, watch } from "@sigrea/core";

import { defaultNavigator, listen, resolveValue } from "../../shared";
import { tryOnScopeDispose } from "../tryOnScopeDispose";
import type {
	MaybeValue,
	NavigatorLike,
	UsePermissionDescriptor,
	UsePermissionNavigatorLike,
	UsePermissionOptions,
	UsePermissionReturn,
	UsePermissionSource,
	UsePermissionStatusLike,
} from "../types";

function isPermissionsNavigator(
	navigator: NavigatorLike | null | undefined,
): navigator is UsePermissionNavigatorLike<UsePermissionStatusLike> {
	return (
		typeof (navigator as UsePermissionNavigatorLike | undefined)?.permissions
			?.query === "function"
	);
}

function resolveDescriptor(
	source: MaybeValue<UsePermissionSource>,
): UsePermissionDescriptor {
	const permission = resolveValue(source);

	return typeof permission === "string" ? { name: permission } : permission;
}

/**
 * Reactive Permissions API state.
 */
export function usePermission<
	TStatus extends UsePermissionStatusLike = PermissionStatus,
	TNavigator extends
		UsePermissionNavigatorLike<TStatus> = UsePermissionNavigatorLike<TStatus>,
>(
	permission: MaybeValue<UsePermissionSource>,
	options: UsePermissionOptions<TNavigator> = {},
): UsePermissionReturn<TStatus> {
	const navigatorTarget: MaybeValue<TNavigator | null | undefined> =
		"navigator" in options
			? options.navigator
			: (defaultNavigator as TNavigator | undefined);
	const state = signal<PermissionState | undefined>(undefined);
	const isSupported = signal(false);
	let stopStatusListener = () => {};
	let queryCount = 0;
	let stopped = false;

	const currentNavigator = () => resolveValue(navigatorTarget);
	const cleanupStatus = () => {
		stopStatusListener();
		stopStatusListener = () => {};
	};
	const syncSupport = (
		navigator: TNavigator | null | undefined,
	): navigator is TNavigator & UsePermissionNavigatorLike<TStatus> => {
		isSupported.value = isPermissionsNavigator(navigator);
		return isSupported.value;
	};
	const setStatus = (status: TStatus) => {
		state.value = status.state;
		stopStatusListener = listen(
			status,
			"change",
			() => {
				state.value = status.state;
			},
			{ passive: true },
		);
	};
	const runQuery = async (
		resetState: boolean,
	): Promise<TStatus | undefined> => {
		if (stopped) {
			return undefined;
		}

		queryCount += 1;
		const queryId = queryCount;
		const navigator = currentNavigator();
		cleanupStatus();
		if (resetState) {
			state.value = undefined;
		}
		if (!syncSupport(navigator)) {
			state.value = undefined;
			return undefined;
		}
		const { permissions } = navigator;
		if (permissions === undefined || permissions === null) {
			state.value = undefined;
			return undefined;
		}

		try {
			const status = await permissions.query(
				resolveDescriptor(permission) as PermissionDescriptor,
			);
			if (stopped || queryId !== queryCount) {
				return undefined;
			}

			setStatus(status);
			return status;
		} catch {
			if (stopped || queryId !== queryCount) {
				return undefined;
			}

			state.value = undefined;
			return undefined;
		}
	};
	const query = (): Promise<TStatus | undefined> => runQuery(false);

	const stopWatch = watch(
		() => ({
			descriptor: resolveDescriptor(permission),
			navigator: currentNavigator(),
		}),
		() => {
			void runQuery(true);
		},
		{ immediate: true, flush: "sync" },
	);
	const stop = () => {
		if (stopped) {
			return;
		}

		stopped = true;
		queryCount += 1;
		cleanupStatus();
		stopWatch();
	};

	tryOnScopeDispose(stop);

	return {
		isSupported: readonly(isSupported),
		state: readonly(state),
		query,
		stop,
	};
}
