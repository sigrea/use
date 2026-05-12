import { readonly, signal, watch } from "@sigrea/core";

import { defaultWindow, resolveTarget, resolveValue } from "../../shared";
import { tryOnScopeDispose } from "../tryOnScopeDispose";
import type {
	MaybeTarget,
	ResizeObserverWindowLike,
	UseResizeObserverOptions,
	UseResizeObserverReturn,
	UseResizeObserverTarget,
} from "../types";

function toArray<T>(value: T | readonly T[] | null | undefined): T[] {
	if (value === undefined || value === null) {
		return [];
	}

	return Array.isArray(value) ? [...value] : [value as T];
}

function getResizeObserver(
	windowTarget: ResizeObserverWindowLike | null | undefined,
	allowGlobalFallback: boolean,
): typeof ResizeObserver | undefined {
	return (
		windowTarget?.ResizeObserver ??
		(allowGlobalFallback ? globalThis.ResizeObserver : undefined)
	);
}

function resolveTargets<TElement extends Element>(
	target: MaybeTarget<UseResizeObserverTarget<TElement>>,
): TElement[] {
	const value = resolveValue(target);
	const targets: TElement[] = [];

	for (const item of toArray(value)) {
		const resolvedTarget = resolveTarget(
			item as MaybeTarget<TElement | null | undefined>,
		);
		if (resolvedTarget !== undefined) {
			targets.push(resolvedTarget as TElement);
		}
	}

	return [...new Set(targets)];
}

function createObserverOptions(
	box: ResizeObserverBoxOptions | undefined,
): ResizeObserverOptions {
	return box === undefined ? {} : { box };
}

export function useResizeObserver<
	TElement extends Element = Element,
	TWindow extends ResizeObserverWindowLike = ResizeObserverWindowLike,
>(
	target: MaybeTarget<UseResizeObserverTarget<TElement>>,
	callback: ResizeObserverCallback,
	options: UseResizeObserverOptions<TWindow> = {},
): UseResizeObserverReturn {
	const { box } = options;
	const useDefaultWindow =
		!("window" in options) || options.window === undefined;
	const windowTarget = useDefaultWindow
		? (defaultWindow as MaybeTarget<TWindow> | undefined)
		: options.window;
	const isSupported = signal(false);
	let stopped = false;
	let cleanupObserver = () => {};
	let stopWatch: () => void = () => {};

	const currentWindow = () =>
		windowTarget === undefined
			? undefined
			: resolveTarget<TWindow | null | undefined>(windowTarget);
	const cleanup = () => {
		cleanupObserver();
		cleanupObserver = () => {};
	};
	const stop = () => {
		if (stopped) {
			return;
		}

		stopped = true;
		stopWatch();
		cleanup();
	};

	stopWatch = watch(
		() => ({
			box: resolveValue(box),
			targets: resolveTargets(target),
			window: currentWindow(),
		}),
		({ box, targets, window }, _previousValue, onCleanup) => {
			cleanup();
			const ResizeObserverCtor = getResizeObserver(window, useDefaultWindow);
			isSupported.value = typeof ResizeObserverCtor === "function";

			if (
				stopped ||
				targets.length === 0 ||
				typeof ResizeObserverCtor !== "function"
			) {
				return;
			}

			let current = true;
			const observer = new ResizeObserverCtor((entries, observer) => {
				if (stopped || !current) {
					return;
				}

				callback(entries, observer);
			});
			const observerOptions = createObserverOptions(box);

			for (const target of targets) {
				observer.observe(target, observerOptions);
			}

			cleanupObserver = () => {
				if (!current) {
					return;
				}

				current = false;
				observer.disconnect();
			};

			onCleanup(cleanup);
		},
		{ immediate: true, flush: "sync" },
	);
	if (stopped) {
		stopWatch();
	}

	tryOnScopeDispose(stop);

	return {
		isSupported: readonly(isSupported),
		stop,
	};
}
