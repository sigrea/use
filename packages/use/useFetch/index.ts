import { computed, readonly, signal, watch } from "@sigrea/core";

import { defaultWindow, resolveTarget, resolveValue } from "../../shared";
import { createEventHook } from "../createEventHook";
import { tryOnScopeDispose } from "../tryOnScopeDispose";
import type {
	AfterFetchContext,
	BeforeFetchContext,
	MaybeTarget,
	MaybeValue,
	OnFetchErrorContext,
	UseFetchDataType,
	UseFetchFetch,
	UseFetchMethod,
	UseFetchOptions,
	UseFetchReturn,
	UseFetchReturnBase,
	UseFetchUrl,
	UseFetchWindowLike,
} from "../types";

interface FetchConfig {
	method: UseFetchMethod;
	payload?: MaybeValue<unknown>;
	payloadType?: string;
	type: UseFetchDataType;
}

const payloadTypeMapping: Record<string, string> = {
	json: "application/json",
	text: "text/plain",
};

const useFetchOptionKeys = new Set([
	"afterFetch",
	"beforeFetch",
	"fetch",
	"immediate",
	"initialData",
	"onFetchError",
	"refetch",
	"timeout",
	"updateDataOnError",
	"window",
]);

function isUseFetchOptions(value: unknown): value is UseFetchOptions {
	if (value === null || typeof value !== "object") {
		return false;
	}

	return Object.keys(value).some((key) => useFetchOptionKeys.has(key));
}

function headersToObject(
	headers: HeadersInit | undefined,
): Record<string, string> {
	const result: Record<string, string> = {};

	if (headers === undefined) {
		return result;
	}

	if (typeof Headers !== "undefined" && headers instanceof Headers) {
		headers.forEach((value, key) => {
			result[key] = value;
		});
		return result;
	}

	if (Array.isArray(headers)) {
		for (const [key, value] of headers) {
			result[key] = value;
		}
		return result;
	}

	return {
		...(headers as Record<string, string>),
	};
}

function mergeHeaders(
	base: HeadersInit | undefined,
	overrides: HeadersInit | undefined,
): Record<string, string> {
	return {
		...headersToObject(base),
		...headersToObject(overrides),
	};
}

function mergeRequestOptions(
	base: RequestInit,
	overrides: RequestInit | undefined,
): RequestInit {
	return {
		...base,
		...overrides,
		headers: mergeHeaders(base.headers, overrides?.headers),
	};
}

function hasHeader(headers: Record<string, string>, name: string): boolean {
	const target = name.toLowerCase();
	return Object.keys(headers).some((key) => key.toLowerCase() === target);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
	if (value === null || typeof value !== "object") {
		return false;
	}

	const prototype = Object.getPrototypeOf(value);
	return prototype === Object.prototype || prototype === null;
}

function isAbortError(error: unknown): boolean {
	return (
		typeof error === "object" &&
		error !== null &&
		"name" in error &&
		error.name === "AbortError"
	);
}

function createResponseError(response: Response): Error {
	return new Error(response.statusText || `HTTP ${response.status}`);
}

function createTimeoutReason(timeout: number): unknown {
	if (typeof DOMException === "function") {
		return new DOMException(
			`Fetch request timed out after ${timeout}ms.`,
			"AbortError",
		);
	}

	return new Error(`Fetch request timed out after ${timeout}ms.`);
}

function readResponse(
	response: Response,
	type: UseFetchDataType,
): Promise<unknown> {
	switch (type) {
		case "arrayBuffer":
			return response.clone().arrayBuffer();
		case "blob":
			return response.clone().blob();
		case "formData":
			return response.clone().formData();
		case "json":
			return response.clone().json();
		case "text":
			return response.clone().text();
	}
}

function prepareRequestOptions(
	fetchOptions: RequestInit,
	config: FetchConfig,
): RequestInit {
	const defaultOptions: RequestInit = {
		method: config.method,
		headers: {},
	};
	const options: RequestInit = {
		...defaultOptions,
		...fetchOptions,
		headers: mergeHeaders(defaultOptions.headers, fetchOptions.headers),
	};
	const payload = resolveValue(config.payload);

	if (payload === null || payload === undefined) {
		return options;
	}

	const headers = headersToObject(options.headers);
	let payloadType = config.payloadType;

	if (
		payloadType === undefined &&
		(Array.isArray(payload) || isPlainObject(payload))
	) {
		payloadType = "json";
	}

	if (payloadType !== undefined && !hasHeader(headers, "Content-Type")) {
		headers["Content-Type"] = payloadTypeMapping[payloadType] ?? payloadType;
	}

	return {
		...options,
		body:
			payloadType === "json" ? JSON.stringify(payload) : (payload as BodyInit),
		headers,
	};
}

function bindAbortSignal(
	source: AbortSignal | null | undefined,
	controller: AbortController,
): () => void {
	if (source === null || source === undefined) {
		return () => {};
	}

	if (source.aborted) {
		controller.abort(source.reason);
		return () => {};
	}

	const abort = () => {
		controller.abort(source.reason);
	};
	source.addEventListener("abort", abort, { once: true });

	return () => {
		source.removeEventListener("abort", abort);
	};
}

function isCurrentExecution(
	currentExecute: number,
	executeCounter: number,
	stopped: boolean,
): boolean {
	return currentExecute === executeCounter && !stopped;
}

/**
 * Reactive fetch request controls.
 */
export function useFetch<Data = unknown>(
	url: MaybeValue<UseFetchUrl>,
): UseFetchReturn<Data>;
export function useFetch<
	Data = unknown,
	TWindow extends UseFetchWindowLike = UseFetchWindowLike,
>(
	url: MaybeValue<UseFetchUrl>,
	options: UseFetchOptions<Data, TWindow>,
): UseFetchReturn<Data>;
export function useFetch<
	Data = unknown,
	TWindow extends UseFetchWindowLike = UseFetchWindowLike,
>(
	url: MaybeValue<UseFetchUrl>,
	fetchOptions: RequestInit,
	options?: UseFetchOptions<Data, TWindow>,
): UseFetchReturn<Data>;
export function useFetch<
	Data = unknown,
	TWindow extends UseFetchWindowLike = UseFetchWindowLike,
>(
	url: MaybeValue<UseFetchUrl>,
	...args:
		| []
		| [UseFetchOptions<Data, TWindow>]
		| [RequestInit, UseFetchOptions<Data, TWindow>?]
): UseFetchReturn<Data> {
	let fetchOptions: RequestInit = {};
	let options: UseFetchOptions<Data, TWindow> = {};

	if (args[0] !== undefined) {
		if (isUseFetchOptions(args[0])) {
			options = args[0] as UseFetchOptions<Data, TWindow>;
		} else {
			fetchOptions = args[0] as RequestInit;
		}
	}
	if (args[1] !== undefined) {
		options = args[1];
	}

	const {
		fetch: configuredFetch,
		immediate = true,
		initialData,
		refetch = false,
		timeout = 0,
		updateDataOnError = false,
	} = options;
	const windowTarget =
		"window" in options && options.window !== undefined
			? options.window
			: (defaultWindow as MaybeTarget<TWindow> | undefined);
	const currentWindow = () =>
		windowTarget === undefined
			? undefined
			: resolveTarget<TWindow>(windowTarget);
	const currentFetch = (): UseFetchFetch | undefined => {
		if (configuredFetch !== undefined) {
			return configuredFetch;
		}

		const window = currentWindow();
		if (typeof window?.fetch === "function") {
			return window.fetch.bind(window);
		}

		return undefined;
	};
	const config: FetchConfig = {
		method: "GET",
		type: "text",
	};
	const resolveInitialData = () => resolveValue(initialData) ?? null;
	const isFinished = signal(false);
	const isFetching = signal(false);
	const aborted = signal(false);
	const statusCode = signal<number | null>(null);
	const response = signal<Response | null>(null);
	const error = signal<unknown | null>(null);
	const data = signal<unknown | null>(resolveInitialData());
	const responseEvent = createEventHook<Response>();
	const errorEvent = createEventHook<unknown>();
	const finallyEvent = createEventHook<void>();
	const canAbort = computed(
		() => typeof AbortController === "function" && isFetching.value,
	);
	let controller: AbortController | undefined;
	let clearExternalAbort = () => {};
	let timeoutId: ReturnType<typeof setTimeout> | undefined;
	let executeCounter = 0;
	let stopped = false;

	const clearTimeoutId = () => {
		if (timeoutId !== undefined) {
			clearTimeout(timeoutId);
			timeoutId = undefined;
		}
	};
	const loading = (value: boolean) => {
		isFetching.value = value;
		isFinished.value = !value;
	};
	const abort = (reason?: unknown) => {
		if (controller === undefined || controller.signal.aborted) {
			return;
		}

		controller.abort(reason);
		aborted.value = true;
	};
	const resetController = (baseSignal: AbortSignal | null | undefined) => {
		clearExternalAbort();
		controller = undefined;

		if (typeof AbortController !== "function") {
			return baseSignal;
		}

		controller = new AbortController();
		controller.signal.addEventListener(
			"abort",
			() => {
				aborted.value = true;
			},
			{ once: true },
		);
		clearExternalAbort = bindAbortSignal(baseSignal, controller);
		aborted.value = controller.signal.aborted;

		return controller.signal;
	};
	const execute = async (throwOnFailed = false): Promise<Response | null> => {
		if (stopped) {
			return null;
		}

		executeCounter += 1;
		const currentExecute = executeCounter;

		abort();
		clearTimeoutId();
		loading(true);
		aborted.value = false;
		error.value = null;
		response.value = null;
		statusCode.value = null;

		const requestOptions = prepareRequestOptions(fetchOptions, config);
		const signal = resetController(requestOptions.signal);
		let canceled = false;
		const context: BeforeFetchContext = {
			url: resolveValue(url),
			options: {
				...requestOptions,
				signal,
			},
			cancel() {
				canceled = true;
			},
		};

		let responseData: unknown | null = null;

		try {
			if (options.beforeFetch !== undefined) {
				const nextContext = await options.beforeFetch(context);
				if (nextContext?.url !== undefined) {
					context.url = nextContext.url;
				}
				if (nextContext?.options !== undefined) {
					context.options = mergeRequestOptions(
						context.options,
						nextContext.options,
					);
				}
			}

			if (!isCurrentExecution(currentExecute, executeCounter, stopped)) {
				return null;
			}

			const fetch = currentFetch();
			if (canceled || fetch === undefined) {
				return null;
			}

			const timeoutValue = resolveValue(timeout);
			if (timeoutValue > 0) {
				timeoutId = setTimeout(() => {
					abort(createTimeoutReason(timeoutValue));
				}, timeoutValue);
			}

			const fetchResponse = await fetch(context.url, context.options);
			if (currentExecute !== executeCounter || stopped) {
				return fetchResponse;
			}

			response.value = fetchResponse;
			statusCode.value = fetchResponse.status;
			responseData = await readResponse(fetchResponse, config.type);
			if (!isCurrentExecution(currentExecute, executeCounter, stopped)) {
				return fetchResponse;
			}

			if (!fetchResponse.ok) {
				throw createResponseError(fetchResponse);
			}

			if (options.afterFetch !== undefined) {
				const nextContext = await options.afterFetch({
					context,
					data: responseData as Data | null,
					execute,
					response: fetchResponse,
				});
				if (!isCurrentExecution(currentExecute, executeCounter, stopped)) {
					return fetchResponse;
				}
				if (nextContext?.data !== undefined) {
					responseData = nextContext.data;
				}
			}

			data.value = responseData;
			await responseEvent.trigger(fetchResponse);
			return fetchResponse;
		} catch (caughtError) {
			if (currentExecute !== executeCounter || stopped) {
				if (throwOnFailed) {
					throw caughtError;
				}
				return null;
			}

			let nextError: unknown = caughtError;
			if (!isAbortError(caughtError) && response.value === null) {
				response.value = null;
			}

			if (options.onFetchError !== undefined) {
				const nextContext = await options.onFetchError({
					context,
					data: responseData as Data | null,
					error: caughtError,
					execute,
					response: response.value,
				});
				if (!isCurrentExecution(currentExecute, executeCounter, stopped)) {
					if (throwOnFailed) {
						throw caughtError;
					}
					return null;
				}
				if (nextContext?.error !== undefined) {
					nextError = nextContext.error;
				}
				if (nextContext?.data !== undefined) {
					responseData = nextContext.data;
				}
			}

			error.value = nextError;
			if (updateDataOnError) {
				data.value = responseData;
			} else {
				data.value = resolveInitialData();
			}
			await errorEvent.trigger(nextError);

			if (throwOnFailed) {
				throw caughtError;
			}

			return null;
		} finally {
			if (currentExecute === executeCounter) {
				clearTimeoutId();
				clearExternalAbort();
				if (!stopped) {
					loading(false);
					await finallyEvent.trigger();
				}
			}
		}
	};
	let stopPayloadWatch = () => {};
	const watchPayload = () => {
		stopPayloadWatch();
		stopPayloadWatch = watch(
			() => ({
				payload: resolveValue(config.payload),
				refetch: resolveValue(refetch),
			}),
			({ refetch: shouldRefetch }, previousValue) => {
				if (previousValue !== undefined && shouldRefetch) {
					void execute();
				}
			},
			{ deep: true },
		);
	};
	const stopRefetchWatch = watch(
		() => ({
			refetch: resolveValue(refetch),
			url: resolveValue(url),
		}),
		({ refetch: shouldRefetch }, previousValue) => {
			if (previousValue !== undefined && shouldRefetch) {
				void execute();
			}
		},
	);
	const baseShell = {} as UseFetchReturnBase<unknown>;
	const shell = Object.create(baseShell) as UseFetchReturn<unknown>;
	const waitUntilFinished = (): Promise<UseFetchReturnBase<unknown>> =>
		new Promise<UseFetchReturnBase<unknown>>((resolve) => {
			if (!isFetching.value && isFinished.value) {
				resolve(baseShell);
				return;
			}

			const stop = watch(isFinished, (finished) => {
				if (finished) {
					stop();
					resolve(baseShell);
				}
			});
		});
	const setMethod =
		(method: UseFetchMethod) =>
		(
			payload?: MaybeValue<unknown>,
			payloadType?: string,
		): UseFetchReturn<unknown> => {
			if (!isFetching.value) {
				config.method = method;
				config.payload = payload;
				config.payloadType = payloadType;
				watchPayload();
			}

			return shell;
		};
	function setType<NextData>(
		type: UseFetchDataType,
	): () => UseFetchReturn<NextData> {
		return () => {
			if (!isFetching.value) {
				config.type = type;
			}

			return shell as UseFetchReturn<NextData>;
		};
	}
	function setJsonType(): <Json = unknown>() => UseFetchReturn<Json> {
		return <Json = unknown>() => {
			if (!isFetching.value) {
				config.type = "json";
			}

			return shell as UseFetchReturn<Json>;
		};
	}
	const stop = () => {
		if (stopped) {
			return;
		}

		stopped = true;
		stopRefetchWatch();
		stopPayloadWatch();
		abort();
		clearTimeoutId();
		clearExternalAbort();
		loading(false);
	};
	Object.assign(baseShell, {
		isFinished: readonly(isFinished),
		isFetching: readonly(isFetching),
		canAbort: readonly(canAbort),
		aborted: readonly(aborted),
		statusCode: readonly(statusCode),
		response: readonly(response),
		error: readonly(error),
		data: readonly(data),
		execute,
		abort,
		stop,
		onFetchResponse: responseEvent.on,
		onFetchError: errorEvent.on,
		onFetchFinally: finallyEvent.on,
		get: setMethod("GET"),
		post: setMethod("POST"),
		put: setMethod("PUT"),
		delete: setMethod("DELETE"),
		patch: setMethod("PATCH"),
		head: setMethod("HEAD"),
		options: setMethod("OPTIONS"),
		json: setJsonType(),
		text: setType<string>("text"),
		blob: setType<Blob>("blob"),
		arrayBuffer: setType<ArrayBuffer>("arrayBuffer"),
		formData: setType<FormData>("formData"),
	});
	Object.assign(shell, {
		// biome-ignore lint/suspicious/noThenProperty: VueUse-compatible await support.
		then<TResult1 = UseFetchReturnBase<unknown>, TResult2 = never>(
			onFulfilled?:
				| ((
						value: UseFetchReturnBase<unknown>,
				  ) => TResult1 | PromiseLike<TResult1>)
				| null,
			onRejected?:
				| ((reason: unknown) => TResult2 | PromiseLike<TResult2>)
				| null,
		): PromiseLike<TResult1 | TResult2> {
			return waitUntilFinished().then(onFulfilled, onRejected);
		},
	});

	tryOnScopeDispose(stop);

	if (immediate) {
		void Promise.resolve().then(() => {
			void execute();
		});
	}

	return shell as UseFetchReturn<Data>;
}
