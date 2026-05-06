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
	UsePreferredLanguagesNavigatorLike,
	UsePreferredLanguagesOptions,
	UsePreferredLanguagesReturn,
	WindowLike,
} from "../types";

function readLanguages(
	navigator: UsePreferredLanguagesNavigatorLike | null | undefined,
): readonly string[] {
	return navigator?.languages ? [...navigator.languages] : [];
}

function supportsLanguages(
	navigator: UsePreferredLanguagesNavigatorLike | null | undefined,
): boolean {
	return (
		navigator !== null && navigator !== undefined && "languages" in navigator
	);
}

export function usePreferredLanguages<
	TWindow extends WindowLike = WindowLike,
	TNavigator extends
		UsePreferredLanguagesNavigatorLike = UsePreferredLanguagesNavigatorLike,
>(
	options: UsePreferredLanguagesOptions<TWindow, TNavigator> = {},
): UsePreferredLanguagesReturn {
	const windowTarget =
		"window" in options && options.window !== undefined
			? options.window
			: (defaultWindow as MaybeTarget<TWindow> | undefined);
	const navigatorTarget: MaybeValue<TNavigator | null | undefined> =
		"navigator" in options ? options.navigator : undefined;
	const languages = signal<readonly string[]>([]);
	const isSupported = signal(false);

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
	const syncLanguages = (navigator: TNavigator | null | undefined): void => {
		isSupported.value = supportsLanguages(navigator);
		languages.value = readLanguages(navigator);
	};
	const stop = watch(
		() => {
			const windowValue = currentWindow();

			return {
				navigator: currentNavigator(windowValue),
				window: windowValue,
			};
		},
		({ navigator, window }, _previousValue, onCleanup) => {
			syncLanguages(navigator);

			if (!window) {
				return;
			}

			const cleanup = listen(
				window,
				"languagechange",
				() => {
					syncLanguages(navigator);
				},
				{ passive: true },
			);

			onCleanup(cleanup);
		},
		{ immediate: true, flush: "sync" },
	);

	return {
		isSupported: readonly(isSupported),
		languages: readonly(languages),
		stop,
	};
}
