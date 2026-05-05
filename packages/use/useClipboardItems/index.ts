import { readonly, signal, watch } from "@sigrea/core";

import {
	defaultNavigator,
	defaultWindow,
	listen,
	resolveValue,
} from "../../shared";
import type {
	ClipboardItemLike,
	ClipboardLike,
	ClipboardNavigatorLike,
	MaybeTarget,
	MaybeValue,
	UseClipboardItemsOptions,
	UseClipboardItemsReturn,
	UseClipboardItemsSource,
	UseClipboardItemsWindowLike,
} from "../types";
import { useTimeoutFn } from "../useTimeoutFn";

function isClipboardItemsSupported(
	clipboard: ClipboardLike | null | undefined,
): clipboard is ClipboardLike {
	return (
		typeof clipboard?.read === "function" ||
		typeof clipboard?.write === "function"
	);
}

function isThenable(value: unknown): value is PromiseLike<unknown> {
	return (
		typeof value === "object" &&
		value !== null &&
		typeof (value as { then?: unknown }).then === "function"
	);
}

function resolveClipboardItems(
	source: UseClipboardItemsSource,
): readonly ClipboardItemLike[] | undefined {
	const resolved = resolveValue(source);

	if (resolved == null || isThenable(resolved)) {
		return undefined;
	}

	if (!Array.isArray(resolved)) {
		return undefined;
	}

	return resolved;
}

/**
 * Reactive Clipboard API for ClipboardItem data.
 */
export function useClipboardItems(
	options?: UseClipboardItemsOptions<undefined>,
): UseClipboardItemsReturn<false>;
export function useClipboardItems(
	options: UseClipboardItemsOptions<UseClipboardItemsSource>,
): UseClipboardItemsReturn<true>;
export function useClipboardItems(
	options: UseClipboardItemsOptions<UseClipboardItemsSource | undefined> = {},
): UseClipboardItemsReturn<boolean> {
	const navigatorTarget: MaybeValue<ClipboardNavigatorLike | null | undefined> =
		"navigator" in options
			? options.navigator
			: (defaultNavigator as ClipboardNavigatorLike | undefined);
	const windowTarget =
		"window" in options && options.window !== undefined
			? options.window
			: (defaultWindow as MaybeTarget<UseClipboardItemsWindowLike> | undefined);
	const { copiedDuring = 1500, read: readOnClipboardEvents = false } = options;
	const isSupported = signal(false);
	const items = signal<readonly ClipboardItemLike[]>([]);
	const copied = signal(false);
	const isCopying = signal(false);
	const error = signal<unknown | null>(null);
	const copiedReset = useTimeoutFn(
		() => {
			copied.value = false;
		},
		copiedDuring,
		{ immediate: false },
	);
	let executionCount = 0;
	let readCount = 0;

	const currentNavigator = () => resolveValue(navigatorTarget);
	const currentWindow = () =>
		windowTarget === undefined ? undefined : resolveValue(windowTarget);
	const currentClipboard = () => currentNavigator()?.clipboard;
	const syncSupport = () => {
		isSupported.value = isClipboardItemsSupported(currentClipboard());
	};
	const markCopied = (value: readonly ClipboardItemLike[]) => {
		readCount += 1;
		error.value = null;
		items.value = [...value];
		copied.value = true;
		copiedReset.start();
	};
	const read = async (): Promise<readonly ClipboardItemLike[] | undefined> => {
		readCount += 1;
		const readId = readCount;
		error.value = null;
		const clipboard = currentClipboard();
		if (typeof clipboard?.read === "function") {
			try {
				const value = await clipboard.read();
				if (readId === readCount) {
					items.value = [...value];
				}
				return value;
			} catch (caughtError) {
				if (readId === readCount) {
					error.value = caughtError;
				}
				return undefined;
			}
		}

		return undefined;
	};
	const copy = async (...args: [UseClipboardItemsSource?]): Promise<void> => {
		const source = args.length > 0 ? args[0] : options.source;
		if (source === undefined) {
			return;
		}

		let resolvedItems: readonly ClipboardItemLike[] | undefined;
		try {
			resolvedItems = resolveClipboardItems(source);
		} catch (caughtError) {
			error.value = caughtError;
			return;
		}

		if (resolvedItems === undefined) {
			return;
		}

		executionCount += 1;
		readCount += 1;
		const executionId = executionCount;
		error.value = null;
		isCopying.value = true;

		try {
			const clipboard = currentClipboard();
			if (typeof clipboard?.write !== "function") {
				return;
			}

			await clipboard.write([...resolvedItems]);
			if (executionId === executionCount) {
				markCopied(resolvedItems);
			}
		} catch (caughtError) {
			if (executionId === executionCount) {
				error.value = caughtError;
			}
		} finally {
			if (executionId === executionCount) {
				isCopying.value = false;
			}
		}
	};
	const supportWatch = watch(
		() => currentNavigator(),
		() => {
			syncSupport();
		},
		{ immediate: true, flush: "sync" },
	);
	const eventWatch = watch(
		() => ({
			clipboard: currentClipboard(),
			window: currentWindow(),
		}),
		({ clipboard, window }, _previousTarget, onCleanup) => {
			if (!readOnClipboardEvents) {
				return;
			}

			const updateItems = () => {
				void read();
			};
			const cleanups: Array<() => void> = [];

			if (
				typeof clipboard?.addEventListener === "function" &&
				typeof clipboard.removeEventListener === "function"
			) {
				clipboard.addEventListener("clipboardchange", updateItems, {
					passive: true,
				});
				cleanups.push(() => {
					clipboard.removeEventListener?.("clipboardchange", updateItems);
				});
			}

			if (window !== undefined) {
				cleanups.push(
					listen(window, "copy", updateItems, { passive: true }),
					listen(window, "cut", updateItems, { passive: true }),
				);
			}

			onCleanup(() => {
				for (const cleanup of cleanups) {
					cleanup();
				}
			});
		},
		{ immediate: true, flush: "sync" },
	);
	const stop = () => {
		executionCount += 1;
		readCount += 1;
		supportWatch();
		eventWatch();
		copiedReset.stop();
		isCopying.value = false;
	};

	return {
		isSupported: readonly(isSupported),
		items: readonly(items),
		copied: readonly(copied),
		isCopying: readonly(isCopying),
		error: readonly(error),
		copy,
		read,
		stop,
	};
}
