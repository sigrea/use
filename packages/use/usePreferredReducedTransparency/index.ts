import { computed } from "@sigrea/core";

import type {
	MatchMediaWindow,
	UseMediaQueryOptions,
	UsePreferredReducedTransparency,
	UsePreferredReducedTransparencyReturn,
	WindowLike,
} from "../types";
import { useMediaQuery } from "../useMediaQuery";

export function usePreferredReducedTransparency<
	TWindow extends MatchMediaWindow = WindowLike & MatchMediaWindow,
>(
	options: UseMediaQueryOptions<TWindow> = {},
): UsePreferredReducedTransparencyReturn {
	const prefersReducedTransparency = useMediaQuery(
		"(prefers-reduced-transparency: reduce)",
		options,
	);
	const preferredReducedTransparency =
		computed<UsePreferredReducedTransparency>(() => {
			if (prefersReducedTransparency.matches.value) {
				return "reduce";
			}

			return "no-preference";
		});

	Object.defineProperty(preferredReducedTransparency, "stop", {
		configurable: true,
		enumerable: false,
		value: () => {
			prefersReducedTransparency.stop();
		},
	});

	return preferredReducedTransparency as UsePreferredReducedTransparencyReturn;
}
