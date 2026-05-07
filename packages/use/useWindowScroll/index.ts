import { defaultWindow } from "../../shared";
import type {
	MaybeTarget,
	UseScrollWindowLike,
	UseWindowScrollOptions,
	UseWindowScrollReturn,
} from "../types";
import { useScroll } from "../useScroll";

export function useWindowScroll<
	TWindow extends UseScrollWindowLike = UseScrollWindowLike,
>(options: UseWindowScrollOptions<TWindow> = {}): UseWindowScrollReturn {
	const { window: configuredWindow, ...scrollOptions } = options;
	const windowTarget =
		"window" in options && configuredWindow !== undefined
			? configuredWindow
			: (defaultWindow as MaybeTarget<TWindow | null | undefined> | undefined);

	return useScroll<TWindow | null | undefined, TWindow>(windowTarget, {
		...scrollOptions,
		window: windowTarget,
	});
}
