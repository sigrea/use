import { computed } from "@sigrea/core";

import type {
	MatchMediaWindow,
	UseMediaQueryOptions,
	UsePreferredContrast,
	UsePreferredContrastReturn,
	WindowLike,
} from "../types";
import { useMediaQuery } from "../useMediaQuery";

export function usePreferredContrast<
	TWindow extends MatchMediaWindow = WindowLike & MatchMediaWindow,
>(options: UseMediaQueryOptions<TWindow> = {}): UsePreferredContrastReturn {
	const prefersMore = useMediaQuery("(prefers-contrast: more)", options);
	const prefersLess = useMediaQuery("(prefers-contrast: less)", options);
	const prefersCustom = useMediaQuery("(prefers-contrast: custom)", options);
	const preferredContrast = computed<UsePreferredContrast>(() => {
		if (prefersMore.matches.value) {
			return "more";
		}
		if (prefersLess.matches.value) {
			return "less";
		}
		if (prefersCustom.matches.value) {
			return "custom";
		}

		return "no-preference";
	});

	Object.defineProperty(preferredContrast, "stop", {
		configurable: true,
		enumerable: false,
		value: () => {
			prefersMore.stop();
			prefersLess.stop();
			prefersCustom.stop();
		},
	});

	return preferredContrast as UsePreferredContrastReturn;
}
