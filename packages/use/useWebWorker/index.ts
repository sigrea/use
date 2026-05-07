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
	MaybeValue,
	UseWebWorkerConstructorSource,
	UseWebWorkerOptions,
	UseWebWorkerReturn,
	UseWebWorkerSource,
	UseWebWorkerWindowLike,
	WorkerConstructorLike,
	WorkerLike,
} from "../types";

function isWorkerConstructor<TWorker extends WorkerLike>(
	value: unknown,
): value is WorkerConstructorLike<TWorker> {
	return typeof value === "function";
}

function isWorkerLike<TWorker extends WorkerLike>(
	value: unknown,
): value is TWorker {
	return (
		typeof (value as EventTarget | null)?.addEventListener === "function" &&
		typeof (value as EventTarget | null)?.removeEventListener === "function" &&
		typeof (value as WorkerLike).postMessage === "function" &&
		typeof (value as WorkerLike).terminate === "function"
	);
}

function isWorkerSupported<TWorker extends WorkerLike>(
	source: UseWebWorkerSource<TWorker>,
	workerConstructor: WorkerConstructorLike<TWorker> | null | undefined,
): boolean {
	return (
		isWorkerLike<TWorker>(source) || isWorkerConstructor(workerConstructor)
	);
}

function resolveWorkerConstructor<TWorker extends WorkerLike>(
	source: UseWebWorkerConstructorSource<TWorker>,
): WorkerConstructorLike<TWorker> | null | undefined {
	if (source === null || source === undefined || isWorkerConstructor(source)) {
		return source;
	}

	return resolveValue(source);
}

/**
 * Dedicated Worker registration and communication controls.
 */
export function useWebWorker<
	Data = unknown,
	Payload = unknown,
	TWorker extends WorkerLike = Worker,
	TWindow extends
		UseWebWorkerWindowLike<TWorker> = UseWebWorkerWindowLike<TWorker>,
>(
	source: MaybeValue<UseWebWorkerSource<TWorker>>,
	options: UseWebWorkerOptions<TWorker, TWindow, Data> = {},
): UseWebWorkerReturn<Data, Payload, TWorker> {
	const windowTarget: MaybeTarget<TWindow> | undefined =
		"window" in options && options.window !== undefined
			? options.window
			: (defaultWindow as MaybeTarget<TWindow> | undefined);
	const immediate = options.immediate ?? true;
	const autoConnect = options.autoConnect ?? true;
	const autoTerminate = options.autoTerminate ?? true;
	const data = signal<Data | null>(null);
	const worker = signal<TWorker | undefined>(undefined);
	const isSupported = signal(false);
	const error = signal<unknown | null>(null);
	let eventCleanups: Array<() => void> = [];
	let explicitlyTerminated = false;
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
	const clearCurrentWorker = (terminateWorker = true) => {
		const currentWorker = worker.value;

		clearEventCleanups();
		worker.value = undefined;
		if (terminateWorker) {
			currentWorker?.terminate();
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

					const messageEvent = event as MessageEvent<Data>;
					data.value = messageEvent.data;
					options.onMessage?.(nextWorker, messageEvent);
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

					error.value = event;
					options.onError?.(nextWorker, event);
				},
				{ passive: true },
			),
			listen(
				nextWorker,
				"messageerror",
				(event) => {
					if (worker.value !== nextWorker || stopped) {
						return;
					}

					const messageEvent = event as MessageEvent;
					error.value = messageEvent;
					options.onMessageError?.(nextWorker, messageEvent);
				},
				{ passive: true },
			),
		];
	};
	const connect = () => {
		if (stopped || explicitlyTerminated) {
			return;
		}

		const window = currentWindow();
		const nextSource = resolveValue(source);
		const nextWorkerConstructor = currentWorkerConstructor(window);
		isSupported.value = isWorkerSupported(nextSource, nextWorkerConstructor);

		if (nextSource === null || nextSource === undefined) {
			clearCurrentWorker();
			return;
		}

		if (isWorkerLike<TWorker>(nextSource)) {
			if (worker.value === nextSource) {
				return;
			}

			clearCurrentWorker();
			worker.value = nextSource;
			error.value = null;
			bindWorkerEvents(nextSource);
			return;
		}

		if (!isWorkerConstructor(nextWorkerConstructor)) {
			clearCurrentWorker();
			return;
		}

		clearCurrentWorker();
		try {
			const nextWorker = new nextWorkerConstructor(
				nextSource,
				resolveValue(options.workerOptions),
			);
			worker.value = nextWorker;
			error.value = null;
			bindWorkerEvents(nextWorker);
		} catch (caughtError) {
			error.value = caughtError;
			worker.value = undefined;
		}
	};
	const open = () => {
		if (stopped) {
			return;
		}

		explicitlyTerminated = false;
		connect();
	};
	const post = (
		message: Payload,
		transferOrOptions?: Transferable[] | StructuredSerializeOptions,
	): boolean => {
		const currentWorker = worker.value;
		if (currentWorker === undefined) {
			return false;
		}

		try {
			(
				currentWorker.postMessage as (
					nextMessage: Payload,
					nextTransferOrOptions?: Transferable[] | StructuredSerializeOptions,
				) => void
			)(message, transferOrOptions);
			return true;
		} catch (caughtError) {
			error.value = caughtError;
			return false;
		}
	};
	const terminate = () => {
		explicitlyTerminated = true;
		clearCurrentWorker();
	};
	let isInitialWatchRun = true;
	const stopWatch = watch(
		() => {
			const window = currentWindow();

			return {
				source: resolveValue(source),
				workerConstructor: currentWorkerConstructor(window),
				workerOptions: resolveValue(options.workerOptions),
				window,
			};
		},
		(
			{ source: nextSource, workerConstructor, workerOptions },
			previousValue,
		) => {
			const isInitial = isInitialWatchRun;
			isInitialWatchRun = false;
			isSupported.value = isWorkerSupported(nextSource, workerConstructor);

			if (nextSource === null || nextSource === undefined) {
				clearCurrentWorker();
				return;
			}

			if (
				!isWorkerLike<TWorker>(nextSource) &&
				!isWorkerConstructor(workerConstructor)
			) {
				clearCurrentWorker();
				return;
			}

			if (
				!isInitial &&
				autoConnect &&
				explicitlyTerminated &&
				previousValue !== undefined &&
				(isWorkerLike<TWorker>(nextSource)
					? previousValue.source !== nextSource
					: previousValue.source !== nextSource ||
						previousValue.workerConstructor !== workerConstructor ||
						previousValue.workerOptions !== workerOptions)
			) {
				explicitlyTerminated = false;
			}

			if (explicitlyTerminated || (isInitial ? !immediate : !autoConnect)) {
				return;
			}

			connect();
		},
		{ immediate: true, flush: "sync" },
	);
	const stop = () => {
		if (stopped) {
			return;
		}

		stopped = true;
		stopWatch();
		terminate();
	};

	if (autoTerminate) {
		tryOnScopeDispose(stop);
	}

	return {
		data: readonly(data),
		worker: readonly(worker),
		isSupported: readonly(isSupported),
		error: readonly(error),
		open,
		post,
		terminate,
		stop,
	};
}
