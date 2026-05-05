import { readonly, signal, watch } from "@sigrea/core";
import { defaultWindow, resolveTarget, resolveValue } from "../../shared";
import type {
	MaybeTarget,
	UseElementVisibilityOptions,
	UseElementVisibilityReturn,
	UseElementVisibilityWindowLike,
} from "../types";

function getIntersectionObserver(
	windowTarget: UseElementVisibilityWindowLike | undefined,
	allowGlobalFallback: boolean,
): typeof IntersectionObserver | undefined {
	return (
		windowTarget?.IntersectionObserver ??
		(allowGlobalFallback ? globalThis.IntersectionObserver : undefined)
	);
}

function readLatestVisibility(
	entries: readonly IntersectionObserverEntry[],
	fallback: boolean,
): boolean {
	let latestVisibility = fallback;
	let latestTime = Number.NEGATIVE_INFINITY;

	for (const entry of entries) {
		if (entry.time >= latestTime) {
			latestVisibility = entry.isIntersecting;
			latestTime = entry.time;
		}
	}

	return latestVisibility;
}

export function useElementVisibility<
	TWindow extends
		UseElementVisibilityWindowLike = UseElementVisibilityWindowLike,
>(
	target: MaybeTarget<Element>,
	options: UseElementVisibilityOptions<TWindow> = {},
): UseElementVisibilityReturn {
	const {
		initialValue = false,
		once = false,
		root,
		rootMargin,
		threshold = 0,
	} = options;
	const useDefaultWindow =
		!("window" in options) || options.window === undefined;
	const windowTarget = useDefaultWindow
		? (defaultWindow as MaybeTarget<TWindow> | undefined)
		: options.window;
	const isVisible = signal(initialValue);
	const isSupported = signal(false);
	let stopped = false;
	let stopWatch: () => void = () => {};

	const currentWindow = () =>
		windowTarget === undefined
			? undefined
			: resolveTarget<TWindow>(windowTarget);
	const currentRoot = () =>
		root === undefined ? undefined : resolveTarget(root);

	const stop = () => {
		if (stopped) {
			return;
		}

		stopped = true;
		stopWatch();
	};

	stopWatch = watch(
		() => ({
			element: resolveTarget(target),
			root: currentRoot(),
			rootMargin: resolveValue(rootMargin),
			threshold: resolveValue(threshold),
			window: currentWindow(),
		}),
		(
			{ element, root, rootMargin, threshold, window },
			previousValue,
			onCleanup,
		) => {
			const IntersectionObserverCtor = getIntersectionObserver(
				window,
				useDefaultWindow,
			);
			isSupported.value = typeof IntersectionObserverCtor === "function";
			if (previousValue !== undefined && element !== previousValue.element) {
				isVisible.value = initialValue;
			}
			if (element === undefined) {
				isVisible.value = initialValue;
				return;
			}

			if (typeof IntersectionObserverCtor !== "function") {
				return;
			}

			const observerOptions: IntersectionObserverInit = {
				threshold,
			};
			if (root !== undefined) {
				observerOptions.root = root;
			}
			if (rootMargin !== undefined) {
				observerOptions.rootMargin = rootMargin;
			}

			let active = true;
			const observer = new IntersectionObserverCtor((entries) => {
				if (stopped || !active) {
					return;
				}

				const previousVisibility = isVisible.value;
				const nextVisibility = readLatestVisibility(
					entries,
					previousVisibility,
				);

				isVisible.value = nextVisibility;

				if (once && nextVisibility !== previousVisibility) {
					stop();
				}
			}, observerOptions);

			observer.observe(element);

			onCleanup(() => {
				active = false;
				observer.disconnect();
				observer.takeRecords();
			});
		},
		{ immediate: true, flush: "sync" },
	);
	if (stopped) {
		stopWatch();
	}

	return {
		isVisible: readonly(isVisible),
		isSupported: readonly(isSupported),
		stop,
	};
}
