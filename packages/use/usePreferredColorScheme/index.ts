import { computed } from "@sigrea/core";

import type {
	MatchMediaWindow,
	UseMediaQueryOptions,
	UsePreferredColorScheme,
	UsePreferredColorSchemeReturn,
	WindowLike,
} from "../types";
import { useMediaQuery } from "../useMediaQuery";

export function usePreferredColorScheme<
	TWindow extends MatchMediaWindow = WindowLike & MatchMediaWindow,
>(options: UseMediaQueryOptions<TWindow> = {}): UsePreferredColorSchemeReturn {
	const preferredLight = useMediaQuery(
		"(prefers-color-scheme: light)",
		options,
	);
	const preferredDark = useMediaQuery("(prefers-color-scheme: dark)", options);
	const colorScheme = computed<UsePreferredColorScheme>(() => {
		if (preferredDark.matches.value) {
			return "dark";
		}
		if (preferredLight.matches.value) {
			return "light";
		}

		return "no-preference";
	});

	Object.defineProperty(colorScheme, "stop", {
		configurable: true,
		enumerable: false,
		value: () => {
			preferredLight.stop();
			preferredDark.stop();
		},
	});

	return colorScheme as UsePreferredColorSchemeReturn;
}
