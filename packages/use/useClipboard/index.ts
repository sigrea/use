import { readonly, signal, watch } from "@sigrea/core";

import {
	defaultDocument,
	defaultNavigator,
	defaultWindow,
	listen,
	resolveValue,
} from "../../shared";
import type {
	ClipboardDocumentLike,
	ClipboardLike,
	ClipboardNavigatorLike,
	MaybeTarget,
	MaybeValue,
	UseClipboardOptions,
	UseClipboardReturn,
	UseClipboardTextSource,
	UseClipboardWindowLike,
} from "../types";
import { useTimeoutFn } from "../useTimeoutFn";

function isClipboardSupported(
	clipboard: ClipboardLike | null | undefined,
): clipboard is ClipboardLike {
	return (
		typeof clipboard?.readText === "function" ||
		typeof clipboard?.writeText === "function"
	);
}

function canUseLegacyCopy(
	documentTarget: ClipboardDocumentLike | null | undefined,
): documentTarget is ClipboardDocumentLike {
	return (
		typeof documentTarget?.createElement === "function" &&
		documentTarget.body !== undefined &&
		typeof documentTarget.execCommand === "function"
	);
}

function isThenable(value: unknown): value is PromiseLike<unknown> {
	return (
		typeof value === "object" &&
		value !== null &&
		typeof (value as { then?: unknown }).then === "function"
	);
}

function resolveClipboardText(
	source: UseClipboardTextSource,
): string | undefined {
	const resolved = resolveValue(source);

	if (resolved == null || isThenable(resolved)) {
		return undefined;
	}

	return resolved;
}

function legacyCopy(
	documentTarget: ClipboardDocumentLike,
	value: string,
): void {
	const textarea = documentTarget.createElement("textarea");
	textarea.value = value;
	textarea.style.position = "absolute";
	textarea.style.opacity = "0";
	textarea.setAttribute("readonly", "");
	documentTarget.body?.appendChild(textarea);
	try {
		textarea.select();
		const copied = documentTarget.execCommand?.("copy") ?? false;
		if (!copied) {
			throw new Error("legacy clipboard copy failed");
		}
	} finally {
		textarea.remove();
	}
}

/**
 * Reactive Clipboard API for plain text.
 */
export function useClipboard(
	options?: UseClipboardOptions<undefined>,
): UseClipboardReturn<false>;
export function useClipboard(
	options: UseClipboardOptions<UseClipboardTextSource>,
): UseClipboardReturn<true>;
export function useClipboard(
	options: UseClipboardOptions<UseClipboardTextSource | undefined> = {},
): UseClipboardReturn<boolean> {
	const navigatorTarget: MaybeValue<ClipboardNavigatorLike | null | undefined> =
		"navigator" in options
			? options.navigator
			: (defaultNavigator as ClipboardNavigatorLike | undefined);
	const documentTarget =
		"document" in options && options.document !== undefined
			? options.document
			: (defaultDocument as MaybeTarget<ClipboardDocumentLike> | undefined);
	const windowTarget =
		"window" in options && options.window !== undefined
			? options.window
			: (defaultWindow as MaybeTarget<UseClipboardWindowLike> | undefined);
	const {
		copiedDuring = 1500,
		legacy = false,
		read: readOnClipboardEvents = false,
	} = options;
	const isSupported = signal(false);
	const text = signal("");
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
	const currentDocument = () =>
		documentTarget === undefined ? undefined : resolveValue(documentTarget);
	const currentWindow = () =>
		windowTarget === undefined ? undefined : resolveValue(windowTarget);
	const currentClipboard = () => currentNavigator()?.clipboard;
	const syncSupport = () => {
		isSupported.value =
			isClipboardSupported(currentClipboard()) ||
			(legacy && canUseLegacyCopy(currentDocument()));
	};
	const markCopied = (value: string) => {
		readCount += 1;
		error.value = null;
		text.value = value;
		copied.value = true;
		copiedReset.start();
	};
	const read = async (): Promise<string | undefined> => {
		readCount += 1;
		const readId = readCount;
		error.value = null;
		const clipboard = currentClipboard();
		if (typeof clipboard?.readText === "function") {
			try {
				const value = await clipboard.readText();
				if (readId === readCount) {
					text.value = value;
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
	const copy = async (...args: [UseClipboardTextSource?]): Promise<void> => {
		const source = args.length > 0 ? args[0] : options.source;
		if (source === undefined) {
			return;
		}

		let resolvedText: string | undefined;
		try {
			resolvedText = resolveClipboardText(source);
		} catch (caughtError) {
			error.value = caughtError;
			return;
		}

		if (resolvedText === undefined) {
			return;
		}

		executionCount += 1;
		readCount += 1;
		const executionId = executionCount;
		error.value = null;
		isCopying.value = true;

		try {
			const clipboard = currentClipboard();
			let nativeError: unknown;
			if (typeof clipboard?.writeText === "function") {
				try {
					await clipboard.writeText(resolvedText);
					if (executionId === executionCount) {
						markCopied(resolvedText);
					}
					return;
				} catch (caughtError) {
					if (!legacy) {
						throw caughtError;
					}
					nativeError = caughtError;
				}
			}

			if (!legacy) {
				return;
			}

			if (executionId !== executionCount) {
				return;
			}

			const document = currentDocument();
			if (!canUseLegacyCopy(document)) {
				if (nativeError !== undefined) {
					throw nativeError;
				}
				return;
			}

			legacyCopy(document, resolvedText);
			if (executionId === executionCount) {
				markCopied(resolvedText);
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
		() => ({
			document: currentDocument(),
			navigator: currentNavigator(),
		}),
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

			const updateText = () => {
				void read();
			};
			const cleanups: Array<() => void> = [];

			if (
				typeof clipboard?.addEventListener === "function" &&
				typeof clipboard.removeEventListener === "function"
			) {
				clipboard.addEventListener("clipboardchange", updateText, {
					passive: true,
				});
				cleanups.push(() => {
					clipboard.removeEventListener?.("clipboardchange", updateText);
				});
			}

			if (window !== undefined) {
				cleanups.push(
					listen(window, "copy", updateText, { passive: true }),
					listen(window, "cut", updateText, { passive: true }),
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
		text: readonly(text),
		copied: readonly(copied),
		isCopying: readonly(isCopying),
		error: readonly(error),
		copy,
		read,
		stop,
	};
}
