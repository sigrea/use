import type {
	MatchMediaWindow,
	UseMediaQueryOptions,
	UseMediaQueryReturn,
	WindowLike,
} from "../types";
import { useMediaQuery } from "../useMediaQuery";

export function usePreferredDark<
	TWindow extends MatchMediaWindow = WindowLike & MatchMediaWindow,
>(options: UseMediaQueryOptions<TWindow> = {}): UseMediaQueryReturn {
	return useMediaQuery("(prefers-color-scheme: dark)", options);
}
