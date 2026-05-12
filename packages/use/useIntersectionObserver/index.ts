import { readonly, signal, watch } from "@sigrea/core";

import { defaultWindow, resolveTarget, resolveValue } from "../../shared";
import { tryOnScopeDispose } from "../tryOnScopeDispose";
import type {
	MaybeTarget,
	UseIntersectionObserverOptions,
	UseIntersectionObserverReturn,
	UseIntersectionObserverTarget,
	UseIntersectionObserverWindowLike,
} from "../types";

function toArray<T>(value: T | readonly T[] | null | undefined): T[] {
	if (value === undefined || value === null) {
		return [];
	}

	return Array.isArray(value) ? [...value] : [value as T];
}

function getIntersectionObserver(
	windowTarget: UseIntersectionObserverWindowLike | null | undefined,
	allowGlobalFallback: boolean,
): typeof IntersectionObserver | undefined {
	return (
		windowTarget?.IntersectionObserver ??
		(allowGlobalFallback ? globalThis.IntersectionObserver : undefined)
	);
}

function resolveTargets<TElement extends Element>(
	target: MaybeTarget<UseIntersectionObserverTarget<TElement>>,
): TElement[] {
	return toArray(resolveValue(target)).filter(
		(element): element is TElement => element !== null && element !== undefined,
	);
}

export function useIntersectionObserver<
	TElement extends Element = Element,
	TWindow extends
		UseIntersectionObserverWindowLike = UseIntersectionObserverWindowLike,
>(
	target: MaybeTarget<UseIntersectionObserverTarget<TElement>>,
	callback: IntersectionObserverCallback,
	options: UseIntersectionObserverOptions<TWindow> = {},
): UseIntersectionObserverReturn {
	const { immediate = true, root, rootMargin, threshold = 0 } = options;
	const useDefaultWindow =
		!("window" in options) || options.window === undefined;
	const windowTarget = useDefaultWindow
		? (defaultWindow as MaybeTarget<TWindow> | undefined)
		: options.window;
	const isSupported = signal(false);
	const isActive = signal(immediate);
	let stopped = false;
	let cleanupObserver = () => {};
	let stopWatch: () => void = () => {};

	const currentWindow = () =>
		windowTarget === undefined
			? undefined
			: resolveTarget<TWindow | null | undefined>(windowTarget);
	const currentRoot = () =>
		root === undefined ? undefined : resolveTarget(root);

	const cleanup = () => {
		cleanupObserver();
		cleanupObserver = () => {};
	};
	const pause = () => {
		if (stopped || !isActive.value) {
			return;
		}

		cleanup();
		isActive.value = false;
	};
	const resume = () => {
		if (stopped || isActive.value) {
			return;
		}

		isActive.value = true;
	};
	const stop = () => {
		if (stopped) {
			return;
		}

		stopped = true;
		cleanup();
		stopWatch();
		isActive.value = false;
	};

	stopWatch = watch(
		() => ({
			active: isActive.value,
			root: currentRoot(),
			rootMargin: resolveValue(rootMargin),
			targets: resolveTargets(target),
			threshold: resolveValue(threshold),
			window: currentWindow(),
		}),
		(
			{ active, root, rootMargin, targets, threshold, window },
			_previous,
			onCleanup,
		) => {
			cleanup();
			const IntersectionObserverCtor = getIntersectionObserver(
				window,
				useDefaultWindow,
			);
			isSupported.value = typeof IntersectionObserverCtor === "function";

			if (
				stopped ||
				!active ||
				targets.length === 0 ||
				typeof IntersectionObserverCtor !== "function"
			) {
				return;
			}

			const observerOptions: IntersectionObserverInit = { threshold };
			if (root !== undefined) {
				observerOptions.root = root;
			}
			if (rootMargin !== undefined) {
				observerOptions.rootMargin = rootMargin;
			}

			let current = true;
			const observer = new IntersectionObserverCtor((entries, observer) => {
				if (stopped || !current || !isActive.value) {
					return;
				}

				callback(entries, observer);
			}, observerOptions);

			for (const element of targets) {
				observer.observe(element);
			}

			cleanupObserver = () => {
				if (!current) {
					return;
				}

				current = false;
				observer.disconnect();
				observer.takeRecords();
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
		isActive: readonly(isActive),
		pause,
		resume,
		stop,
	};
}
