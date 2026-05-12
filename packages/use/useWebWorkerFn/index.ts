import { readonly, signal, watch } from "@sigrea/core";

import {
	defaultWindow,
	listen,
	resolveTarget,
	resolveValue,
} from "../../shared";
import { tryOnScopeDispose } from "../tryOnScopeDispose";
import type {
	MaybeTarget,
	UseWebWorkerConstructorSource,
	UseWebWorkerFnCallable,
	UseWebWorkerFnLocalDependency,
	UseWebWorkerFnOptions,
	UseWebWorkerFnResult,
	UseWebWorkerFnReturn,
	UseWebWorkerFnStatus,
	UseWebWorkerFnTerminateStatus,
	UseWebWorkerFnUrlLike,
	UseWebWorkerFnWindowLike,
	WorkerConstructorLike,
	WorkerLike,
} from "../types";

const SUCCESS_STATUS = "SUCCESS" satisfies UseWebWorkerFnStatus;
const ERROR_STATUS = "ERROR" satisfies UseWebWorkerFnStatus;
const RUNNING_STATUS = "RUNNING" satisfies UseWebWorkerFnStatus;
const PENDING_STATUS = "PENDING" satisfies UseWebWorkerFnStatus;
const TIMEOUT_STATUS = "TIMEOUT_EXPIRED" satisfies UseWebWorkerFnStatus;

function isWorkerConstructor<TWorker extends WorkerLike>(
	value: unknown,
): value is WorkerConstructorLike<TWorker> {
	return typeof value === "function";
}

function resolveWorkerConstructor<TWorker extends WorkerLike>(
	source: UseWebWorkerConstructorSource<TWorker>,
): WorkerConstructorLike<TWorker> | null | undefined {
	if (source === null || source === undefined || isWorkerConstructor(source)) {
		return source;
	}

	return resolveValue(source);
}

function isSupportedWindow<TWorker extends WorkerLike>(
	window: UseWebWorkerFnWindowLike<TWorker> | null | undefined,
	workerConstructor: WorkerConstructorLike<TWorker> | null | undefined,
): boolean {
	return (
		isWorkerConstructor(workerConstructor) &&
		typeof window?.Blob === "function" &&
		typeof window.URL?.createObjectURL === "function" &&
		typeof window.URL.revokeObjectURL === "function"
	);
}

function stringifyLocalDependency(
	dependency: UseWebWorkerFnLocalDependency,
): string {
	const source = dependency.toString();
	const trimmedSource = source.trim();
	if (/^(async\s+)?function\b/.test(trimmedSource)) {
		return trimmedSource;
	}

	const name = dependency.name;
	if (name === "") {
		throw new TypeError("localDependencies must contain named functions");
	}

	return `const ${name} = ${trimmedSource}`;
}

function createWorkerCode<T extends UseWebWorkerFnCallable>(
	fn: T,
	dependencies: readonly string[],
	localDependencies: readonly UseWebWorkerFnLocalDependency[],
): string {
	const dependencyCode =
		dependencies.length === 0
			? ""
			: `importScripts(${dependencies.map((dependency) => JSON.stringify(dependency)).join(",")});`;
	const localDependencyCode = localDependencies
		.map((dependency) => stringifyLocalDependency(dependency))
		.join(";\n");
	const runnerCode = `
const __sigreaWorkerFn = ${fn.toString()};
self.onmessage = async (event) => {
	const args = event.data;
	try {
		const result = await __sigreaWorkerFn(...args);
		self.postMessage(["${SUCCESS_STATUS}", result]);
	} catch (caughtError) {
		self.postMessage(["${ERROR_STATUS}", caughtError]);
	}
};
`;

	return [dependencyCode, localDependencyCode, runnerCode]
		.filter((code) => code !== "")
		.join("\n");
}

function createError(message: string): Error {
	return new Error(`[useWebWorkerFn] ${message}`);
}

function normalizeTerminateStatus(
	status: UseWebWorkerFnStatus,
): UseWebWorkerFnTerminateStatus {
	if (status === SUCCESS_STATUS || status === RUNNING_STATUS) {
		return PENDING_STATUS;
	}

	return status;
}

/**
 * Runs a function in a short-lived Dedicated Worker.
 */
export function useWebWorkerFn<
	T extends UseWebWorkerFnCallable,
	TWorker extends WorkerLike = Worker,
	TWindow extends
		UseWebWorkerFnWindowLike<TWorker> = UseWebWorkerFnWindowLike<TWorker>,
>(
	fn: T,
	options: UseWebWorkerFnOptions<TWorker, TWindow> = {},
): UseWebWorkerFnReturn<T> {
	const windowTarget: MaybeTarget<TWindow> | undefined =
		"window" in options && options.window !== undefined
			? options.window
			: (defaultWindow as MaybeTarget<TWindow> | undefined);
	const workerStatus = signal<UseWebWorkerFnStatus>(PENDING_STATUS);
	const worker = signal<TWorker | undefined>(undefined);
	const isSupported = signal(false);
	const error = signal<unknown | null>(null);
	let activeWorkerUrl: string | undefined;
	let activeWorkerUrlApi: UseWebWorkerFnUrlLike | undefined;
	let eventCleanups: Array<() => void> = [];
	let timeoutId: ReturnType<typeof setTimeout> | undefined;
	let activeResolve: ((result: UseWebWorkerFnResult<T>) => void) | undefined;
	let activeReject: ((reason: unknown) => void) | undefined;
	let stopped = false;

	const currentWindow = () =>
		windowTarget === undefined
			? undefined
			: resolveTarget<TWindow | null | undefined>(windowTarget);
	const currentWorkerConstructor = (
		window: TWindow | null | undefined,
	): WorkerConstructorLike<TWorker> | null | undefined => {
		if ("worker" in options && options.worker !== undefined) {
			return resolveWorkerConstructor(options.worker);
		}

		return window?.Worker;
	};
	const clearEventCleanups = () => {
		for (const cleanup of eventCleanups) {
			cleanup();
		}
		eventCleanups = [];
	};
	const clearTimeoutId = () => {
		if (timeoutId === undefined) {
			return;
		}

		clearTimeout(timeoutId);
		timeoutId = undefined;
	};
	const clearActiveWorker = () => {
		const currentWorker = worker.value;
		const currentUrl = activeWorkerUrl;
		const currentUrlApi = activeWorkerUrlApi;

		clearEventCleanups();
		clearTimeoutId();
		worker.value = undefined;
		activeWorkerUrl = undefined;
		activeWorkerUrlApi = undefined;
		currentWorker?.terminate();
		if (currentUrl !== undefined) {
			currentUrlApi?.revokeObjectURL(currentUrl);
		}
	};
	const finishWorker = (
		status: UseWebWorkerFnStatus,
		options: { reject?: boolean; reason?: unknown } = {},
	): void => {
		const reject = activeReject;
		activeResolve = undefined;
		activeReject = undefined;
		clearActiveWorker();
		workerStatus.value = status;

		if (options.reject === true) {
			error.value = options.reason;
			reject?.(options.reason);
		}
	};
	const bindWorkerEvents = (nextWorker: TWorker) => {
		eventCleanups = [
			listen(
				nextWorker,
				"message",
				(event) => {
					if (worker.value !== nextWorker || stopped) {
						return;
					}

					const [status, result] = (
						event as MessageEvent<
							[UseWebWorkerFnStatus, UseWebWorkerFnResult<T> | unknown]
						>
					).data;
					if (status === SUCCESS_STATUS) {
						activeResolve?.(result as UseWebWorkerFnResult<T>);
						finishWorker(SUCCESS_STATUS);
						return;
					}

					finishWorker(ERROR_STATUS, { reject: true, reason: result });
				},
				{ passive: true },
			),
			listen(
				nextWorker,
				"error",
				(event) => {
					if (worker.value !== nextWorker || stopped) {
						return;
					}

					if (typeof event.preventDefault === "function") {
						event.preventDefault();
					}
					finishWorker(ERROR_STATUS, { reject: true, reason: event });
				},
				{ passive: false },
			),
			listen(
				nextWorker,
				"messageerror",
				(event) => {
					if (worker.value !== nextWorker || stopped) {
						return;
					}

					finishWorker(ERROR_STATUS, { reject: true, reason: event });
				},
				{ passive: true },
			),
		];
	};
	const workerTerminate = (
		status: UseWebWorkerFnTerminateStatus = PENDING_STATUS,
	) => {
		const hasActiveWorker = worker.value !== undefined;
		const rejectReason = hasActiveWorker
			? createError("worker terminated")
			: undefined;
		finishWorker(normalizeTerminateStatus(status as UseWebWorkerFnStatus), {
			reject: hasActiveWorker,
			reason: rejectReason,
		});
	};
	const startTimeout = (timeout: number | undefined) => {
		if (timeout === undefined) {
			return;
		}

		timeoutId = setTimeout(() => {
			finishWorker(TIMEOUT_STATUS, {
				reject: true,
				reason: createError("worker timed out"),
			});
		}, timeout);
	};
	const workerFn = (
		...fnArgs: Parameters<T>
	): Promise<UseWebWorkerFnResult<T>> => {
		if (stopped) {
			const stoppedError = createError("worker function is stopped");
			error.value = stoppedError;
			workerStatus.value = ERROR_STATUS;
			return Promise.reject(stoppedError);
		}
		if (workerStatus.value === RUNNING_STATUS) {
			const runningError = createError(
				"only one worker function can run at a time",
			);
			error.value = runningError;
			return Promise.reject(runningError);
		}

		const window = currentWindow();
		const workerConstructor = currentWorkerConstructor(window);
		isSupported.value = isSupportedWindow(window, workerConstructor);
		if (!isSupportedWindow(window, workerConstructor)) {
			const unsupportedError = createError(
				"Worker, Blob, or object URL support is missing",
			);
			error.value = unsupportedError;
			workerStatus.value = ERROR_STATUS;
			return Promise.reject(unsupportedError);
		}
		const supportedWindow = window as NonNullable<TWindow> & {
			Blob: NonNullable<UseWebWorkerFnWindowLike<TWorker>["Blob"]>;
			URL: NonNullable<UseWebWorkerFnWindowLike<TWorker>["URL"]>;
		};
		const supportedWorkerConstructor =
			workerConstructor as WorkerConstructorLike<TWorker>;

		return new Promise<UseWebWorkerFnResult<T>>((resolve, reject) => {
			activeResolve = resolve;
			activeReject = reject;

			try {
				const dependencies = resolveValue(options.dependencies) ?? [];
				const localDependencies = resolveValue(options.localDependencies) ?? [];
				const workerCode = createWorkerCode(
					fn,
					dependencies,
					localDependencies,
				);
				const blob = new supportedWindow.Blob([workerCode], {
					type: "text/javascript",
				});
				const workerUrl = supportedWindow.URL.createObjectURL(blob);
				activeWorkerUrl = workerUrl;
				activeWorkerUrlApi = supportedWindow.URL;
				const nextWorker = new supportedWorkerConstructor(workerUrl);

				worker.value = nextWorker;
				workerStatus.value = RUNNING_STATUS;
				error.value = null;
				bindWorkerEvents(nextWorker);
				startTimeout(resolveValue(options.timeout));
				nextWorker.postMessage([...fnArgs]);
			} catch (caughtError) {
				finishWorker(ERROR_STATUS, { reject: true, reason: caughtError });
			}
		});
	};
	const stopSupportWatch = watch(
		() => {
			const window = currentWindow();

			return {
				window,
				workerConstructor: currentWorkerConstructor(window),
			};
		},
		({ window, workerConstructor }) => {
			isSupported.value = isSupportedWindow(window, workerConstructor);
		},
		{ immediate: true, flush: "sync" },
	);
	const stop = () => {
		if (stopped) {
			return;
		}

		stopped = true;
		stopSupportWatch();
		workerTerminate(PENDING_STATUS);
	};

	tryOnScopeDispose(stop);

	return {
		workerFn,
		workerStatus: readonly(workerStatus),
		isSupported: readonly(isSupported),
		error: readonly(error),
		workerTerminate,
		stop,
	};
}
