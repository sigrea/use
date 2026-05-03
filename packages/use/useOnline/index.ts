import { readonly, signal, watch } from "@sigrea/core";
import {
	defaultWindow,
	listen,
	resolveTarget,
	resolveValue,
} from "../../shared";
import type {
	MaybeTarget,
	OnlineNavigatorLike,
	UseOnlineOptions,
	UseOnlineReturn,
	WindowLike,
} from "../types";

function readOnline(
	navigator: OnlineNavigatorLike | null | undefined,
): boolean {
	return navigator?.onLine ?? true;
}

export function useOnline<
	TWindow extends WindowLike = WindowLike,
	TNavigator extends OnlineNavigatorLike = OnlineNavigatorLike,
>(options: UseOnlineOptions<TWindow, TNavigator> = {}): UseOnlineReturn {
	const windowTarget =
		"window" in options && options.window !== undefined
			? options.window
			: (defaultWindow as MaybeTarget<TWindow> | undefined);
	const resolveCurrentWindow = () =>
		windowTarget === undefined
			? undefined
			: resolveTarget<TWindow>(windowTarget);
	const resolveCurrentNavigator = (currentWindow: TWindow | undefined) => {
		const currentNavigator = resolveValue(options.navigator);
		return currentNavigator === undefined
			? (currentWindow?.navigator as TNavigator | null | undefined)
			: currentNavigator;
	};
	const initialWindow = resolveCurrentWindow();
	const isOnline = signal(readOnline(resolveCurrentNavigator(initialWindow)));
	const stop = watch(
		() => {
			const currentWindow = resolveCurrentWindow();

			return {
				navigator: resolveCurrentNavigator(currentWindow),
				window: currentWindow,
			};
		},
		(nextValue, _previousValue, onCleanup) => {
			isOnline.value = readOnline(nextValue.navigator);

			if (nextValue.window === undefined || nextValue.window === null) {
				return;
			}

			const syncOnline = () => {
				isOnline.value = readOnline(nextValue.navigator);
			};
			const cleanups = [
				listen(nextValue.window, "online", syncOnline, { passive: true }),
				listen(nextValue.window, "offline", syncOnline, { passive: true }),
			];

			onCleanup(() => {
				for (const cleanup of cleanups) {
					cleanup();
				}
			});
		},
		{ immediate: true, flush: "sync" },
	);

	return {
		isOnline: readonly(isOnline),
		stop,
	};
}
