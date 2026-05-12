import { readonly, signal, watch } from "@sigrea/core";

import { defaultWindow, resolveTarget, resolveValue } from "../../shared";
import { tryOnScopeDispose } from "../tryOnScopeDispose";
import type {
	MaybeTarget,
	UseMutationObserverOptions,
	UseMutationObserverReturn,
	UseMutationObserverTarget,
	UseMutationObserverWindowLike,
} from "../types";

function toArray<T>(value: T | readonly T[] | null | undefined): T[] {
	if (value === undefined || value === null) {
		return [];
	}

	return Array.isArray(value) ? [...value] : [value as T];
}

function getMutationObserver(
	windowTarget: UseMutationObserverWindowLike | null | undefined,
	allowGlobalFallback: boolean,
): typeof MutationObserver | undefined {
	return (
		windowTarget?.MutationObserver ??
		(allowGlobalFallback ? globalThis.MutationObserver : undefined)
	);
}

function resolveTargets<TNode extends Node>(
	target: MaybeTarget<UseMutationObserverTarget<TNode>>,
): TNode[] {
	const value = resolveValue(target);
	const targets: TNode[] = [];

	for (const item of toArray(value)) {
		const resolvedTarget = resolveTarget(
			item as MaybeTarget<TNode | null | undefined>,
		);
		if (resolvedTarget !== undefined) {
			targets.push(resolvedTarget as TNode);
		}
	}

	return [...new Set(targets)];
}

export function useMutationObserver<
	TNode extends Node = Node,
	TWindow extends UseMutationObserverWindowLike = UseMutationObserverWindowLike,
>(
	target: MaybeTarget<UseMutationObserverTarget<TNode>>,
	callback: MutationCallback,
	options: UseMutationObserverOptions<TWindow> = {},
): UseMutationObserverReturn {
	const { window: _window, ...mutationOptions } = options;
	const useDefaultWindow =
		!("window" in options) || options.window === undefined;
	const windowTarget = useDefaultWindow
		? (defaultWindow as MaybeTarget<TWindow> | undefined)
		: options.window;
	const isSupported = signal(false);
	let stopped = false;
	let observer: MutationObserver | undefined;
	let cleanupObserver = () => {};
	let stopWatch: () => void = () => {};

	const currentWindow = () =>
		windowTarget === undefined
			? undefined
			: resolveTarget<TWindow | null | undefined>(windowTarget);
	const cleanup = () => {
		cleanupObserver();
		cleanupObserver = () => {};
		observer = undefined;
	};
	const takeRecords = () => observer?.takeRecords();
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
			targets: resolveTargets(target),
			window: currentWindow(),
		}),
		({ targets, window }, _previousValue, onCleanup) => {
			cleanup();
			const MutationObserverCtor = getMutationObserver(
				window,
				useDefaultWindow,
			);
			isSupported.value = typeof MutationObserverCtor === "function";

			if (
				stopped ||
				targets.length === 0 ||
				typeof MutationObserverCtor !== "function"
			) {
				return;
			}

			let current = true;
			const nextObserver = new MutationObserverCtor((records, observer) => {
				if (stopped || !current) {
					return;
				}

				callback(records, observer);
			});

			for (const target of targets) {
				nextObserver.observe(target, mutationOptions);
			}

			observer = nextObserver;
			cleanupObserver = () => {
				if (!current) {
					return;
				}

				current = false;
				nextObserver.disconnect();
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
		takeRecords,
	};
}
