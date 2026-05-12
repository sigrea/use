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
	UseNavigatorLanguageNavigatorLike,
	UseNavigatorLanguageOptions,
	UseNavigatorLanguageReturn,
	WindowLike,
} from "../types";

function readLanguage(
	navigator: UseNavigatorLanguageNavigatorLike | null | undefined,
): string | undefined {
	return navigator?.language;
}

function supportsLanguage(
	navigator: UseNavigatorLanguageNavigatorLike | null | undefined,
): boolean {
	return (
		navigator !== null && navigator !== undefined && "language" in navigator
	);
}

export function useNavigatorLanguage<
	TWindow extends WindowLike = WindowLike,
	TNavigator extends
		UseNavigatorLanguageNavigatorLike = UseNavigatorLanguageNavigatorLike,
>(
	options: UseNavigatorLanguageOptions<TWindow, TNavigator> = {},
): UseNavigatorLanguageReturn {
	const windowTarget =
		"window" in options && options.window !== undefined
			? options.window
			: (defaultWindow as MaybeTarget<TWindow> | undefined);
	const navigatorTarget: MaybeValue<TNavigator | null | undefined> =
		"navigator" in options ? options.navigator : undefined;
	const language = signal<string | undefined>(undefined);
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
	const syncLanguage = (navigator: TNavigator | null | undefined): void => {
		isSupported.value = supportsLanguage(navigator);
		language.value = readLanguage(navigator);
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
			syncLanguage(navigator);

			if (!window) {
				return;
			}

			const cleanup = listen(
				window,
				"languagechange",
				() => {
					syncLanguage(navigator);
				},
				{ passive: true },
			);

			onCleanup(cleanup);
		},
		{ immediate: true, flush: "sync" },
	);

	return {
		isSupported: readonly(isSupported),
		language: readonly(language),
		stop,
	};
}
