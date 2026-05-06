import { computed } from "@sigrea/core";

import type {
	MatchMediaWindow,
	UseMediaQueryOptions,
	UsePreferredReducedMotion,
	UsePreferredReducedMotionReturn,
	WindowLike,
} from "../types";
import { useMediaQuery } from "../useMediaQuery";

export function usePreferredReducedMotion<
	TWindow extends MatchMediaWindow = WindowLike & MatchMediaWindow,
>(
	options: UseMediaQueryOptions<TWindow> = {},
): UsePreferredReducedMotionReturn {
	const prefersReducedMotion = useMediaQuery(
		"(prefers-reduced-motion: reduce)",
		options,
	);
	const preferredReducedMotion = computed<UsePreferredReducedMotion>(() => {
		if (prefersReducedMotion.matches.value) {
			return "reduce";
		}

		return "no-preference";
	});

	Object.defineProperty(preferredReducedMotion, "stop", {
		configurable: true,
		enumerable: false,
		value: () => {
			prefersReducedMotion.stop();
		},
	});

	return preferredReducedMotion as UsePreferredReducedMotionReturn;
}
