import { readonly, signal, watch } from "@sigrea/core";

import { defaultNavigator, resolveValue } from "../../shared";
import type {
	MaybeValue,
	UseShareData,
	UseShareNavigatorLike,
	UseShareOptions,
	UseShareReturn,
} from "../types";

function hasShareApi(
	navigator: UseShareNavigatorLike | null | undefined,
): navigator is UseShareNavigatorLike & {
	canShare(data?: UseShareData): boolean;
	share(data?: UseShareData): Promise<void>;
} {
	return (
		typeof navigator?.canShare === "function" &&
		typeof navigator.share === "function"
	);
}

function toShareData(data: UseShareData | null | undefined): UseShareData {
	if (data === undefined || data === null) {
		return {};
	}

	const nextData: UseShareData = {};
	if (data.files !== undefined) {
		nextData.files = [...data.files];
	}
	if (data.title !== undefined) {
		nextData.title = data.title;
	}
	if (data.text !== undefined) {
		nextData.text = data.text;
	}
	if (data.url !== undefined) {
		nextData.url = data.url;
	}

	return nextData;
}

function mergeShareData(
	base: MaybeValue<UseShareData | null | undefined>,
	override: MaybeValue<UseShareData | null | undefined>,
): UseShareData {
	return {
		...toShareData(resolveValue(base)),
		...toShareData(resolveValue(override)),
	};
}

/**
 * Reactive Web Share API controls.
 */
export function useShare<
	TNavigator extends UseShareNavigatorLike = UseShareNavigatorLike,
>(
	shareOptions: MaybeValue<UseShareData | null | undefined> = {},
	options: UseShareOptions<TNavigator> = {},
): UseShareReturn {
	const navigatorTarget: MaybeValue<TNavigator | null | undefined> =
		"navigator" in options
			? options.navigator
			: (defaultNavigator as TNavigator | undefined);
	const isSupported = signal(false);

	const currentNavigator = () => resolveValue(navigatorTarget);
	const syncSupport = () => {
		isSupported.value = hasShareApi(currentNavigator());
	};
	const canShare = (
		overrideOptions: MaybeValue<UseShareData | null | undefined> = {},
	): boolean => {
		const navigator = currentNavigator();
		if (!hasShareApi(navigator)) {
			return false;
		}

		return navigator.canShare(mergeShareData(shareOptions, overrideOptions));
	};
	const share = async (
		overrideOptions: MaybeValue<UseShareData | null | undefined> = {},
	): Promise<void> => {
		const navigator = currentNavigator();
		if (!hasShareApi(navigator)) {
			return;
		}

		const data = mergeShareData(shareOptions, overrideOptions);
		if (!navigator.canShare(data)) {
			return;
		}

		await navigator.share(data);
	};
	const stop = watch(
		currentNavigator,
		() => {
			syncSupport();
		},
		{ immediate: true, flush: "sync" },
	);

	return {
		isSupported: readonly(isSupported),
		canShare,
		share,
		stop,
	};
}
