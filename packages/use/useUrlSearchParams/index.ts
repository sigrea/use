import { deepSignal, nextTick, watch } from "@sigrea/core";

import { defaultWindow, listen, resolveTarget } from "../../shared";
import { tryOnScopeDispose } from "../tryOnScopeDispose";
import type {
	MaybeTarget,
	UrlParams,
	UseUrlSearchParamsMode,
	UseUrlSearchParamsOptions,
	UseUrlSearchParamsWindowLike,
} from "../types";

function hasSearchParams(params: URLSearchParams): boolean {
	return params.toString() !== "";
}

function getRawParams(
	mode: UseUrlSearchParamsMode,
	window: UseUrlSearchParamsWindowLike,
): string {
	if (mode === "history") {
		return window.location?.search ?? "";
	}

	if (mode === "hash") {
		const hash = window.location?.hash ?? "";
		const index = hash.indexOf("?");
		return index > 0 ? hash.slice(index) : "";
	}

	return (window.location?.hash ?? "").replace(/^#/, "");
}

function readParams(
	mode: UseUrlSearchParamsMode,
	window: UseUrlSearchParamsWindowLike,
): URLSearchParams {
	return new URLSearchParams(getRawParams(mode, window));
}

function updateState(
	state: Record<string, unknown>,
	params: URLSearchParams,
): void {
	const unusedKeys = new Set(Object.keys(state));
	const keys = new Set<string>();

	for (const [key] of params as unknown as Iterable<[string, string]>) {
		keys.add(key);
	}

	for (const key of keys) {
		const values = params.getAll(key);
		state[key] = values.length > 1 ? values : (params.get(key) ?? "");
		unusedKeys.delete(key);
	}

	for (const key of unusedKeys) {
		delete state[key];
	}
}

function appendStateToParams(
	params: URLSearchParams,
	state: Record<string, unknown>,
	removeNullishValues: boolean,
	removeFalsyValues: boolean,
): void {
	for (const key of Object.keys(state)) {
		const value = state[key];

		if (Array.isArray(value)) {
			for (const entry of value) {
				params.append(key, String(entry));
			}
		} else if (removeNullishValues && value == null) {
			params.delete(key);
		} else if (removeFalsyValues && !value) {
			params.delete(key);
		} else {
			params.set(key, String(value));
		}
	}
}

function constructQuery(
	mode: UseUrlSearchParamsMode,
	window: UseUrlSearchParamsWindowLike,
	params: URLSearchParams,
	stringify: (params: URLSearchParams) => string,
): string {
	const stringified = stringify(params);
	const location = window.location;
	const search = location?.search ?? "";
	const hash = location?.hash ?? "";

	if (mode === "history") {
		return `${stringified ? `?${stringified}` : ""}${hash}`;
	}

	if (mode === "hash-params") {
		return `${search}${stringified ? `#${stringified}` : ""}`;
	}

	const baseHash = hash || "#";
	const index = baseHash.indexOf("?");
	if (index > 0) {
		return `${search}${baseHash.slice(0, index)}${stringified ? `?${stringified}` : ""}`;
	}

	return `${search}${baseHash}${stringified ? `?${stringified}` : ""}`;
}

/**
 * Reactive URLSearchParams.
 */
export function useUrlSearchParams<
	T extends object = UrlParams,
	TWindow extends UseUrlSearchParamsWindowLike = UseUrlSearchParamsWindowLike,
>(
	mode: UseUrlSearchParamsMode = "history",
	options: UseUrlSearchParamsOptions<T, TWindow> = {},
): T {
	const {
		initialValue = {} as T,
		removeNullishValues = true,
		removeFalsyValues = false,
		write: enableWrite = true,
		writeMode = "replace",
		stringify = (params) => params.toString(),
	} = options;
	const useDefaultWindow =
		!("window" in options) || options.window === undefined;
	const windowTarget = useDefaultWindow
		? (defaultWindow as MaybeTarget<TWindow> | undefined)
		: options.window;
	const currentWindow = () =>
		windowTarget === undefined
			? undefined
			: (resolveTarget<TWindow | null | undefined>(windowTarget) ?? undefined);
	const state = deepSignal({}) as Record<string, unknown>;
	let paused = false;

	function resetStateToInitialValue(): void {
		for (const key of Object.keys(state)) {
			delete state[key];
		}
		Object.assign(state, initialValue);
	}

	function syncStateFromWindow(window: UseUrlSearchParamsWindowLike): void {
		const initial = readParams(mode, window);

		if (hasSearchParams(initial)) {
			paused = true;
			updateState(state, initial);
			void nextTick(() => {
				paused = false;
			});
		} else {
			resetStateToInitialValue();
		}
	}

	function writeParams(
		params: URLSearchParams,
		shouldUpdate: boolean,
		shouldWriteHistory = true,
	): void {
		const window = currentWindow();
		if (window === undefined) {
			return;
		}

		paused = true;

		if (shouldUpdate) {
			updateState(state, params);
		}

		const history = window.history;
		const pathname = window.location?.pathname ?? "/";
		const url = `${pathname}${constructQuery(mode, window, params, stringify)}`;
		const title = window.document?.title ?? "";

		if (enableWrite && shouldWriteHistory) {
			if (writeMode === "replace") {
				history?.replaceState?.call(history, history.state ?? null, title, url);
			} else {
				history?.pushState?.call(history, history.state ?? null, title, url);
			}
		}

		void nextTick(() => {
			paused = false;
		});
	}

	const stopStateWatch = watch(
		state,
		() => {
			if (paused) {
				return;
			}

			const params = new URLSearchParams("");
			appendStateToParams(
				params,
				state,
				removeNullishValues,
				removeFalsyValues,
			);
			writeParams(params, false);
		},
		{ deep: true },
	);

	function onChanged(): void {
		const window = currentWindow();
		if (window === undefined) {
			return;
		}

		writeParams(readParams(mode, window), true, false);
	}

	const listenerOptions = { passive: true };
	const stopPopstate = listen(
		windowTarget,
		"popstate",
		onChanged,
		listenerOptions,
	);
	const stopHashchange =
		mode === "history"
			? () => {}
			: listen(windowTarget, "hashchange", onChanged, listenerOptions);
	const stopWindowWatch = watch(
		currentWindow,
		(window) => {
			if (window === undefined) {
				resetStateToInitialValue();
				return;
			}

			syncStateFromWindow(window);
		},
		{ immediate: true, flush: "sync" },
	);

	tryOnScopeDispose(() => {
		stopStateWatch();
		stopPopstate();
		stopHashchange();
		stopWindowWatch();
	});

	return state as T;
}
