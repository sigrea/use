import { readonly, signal } from "@sigrea/core";

import type {
	UseAsyncQueueOptions,
	UseAsyncQueueResult,
	UseAsyncQueueResultList,
	UseAsyncQueueResultState,
	UseAsyncQueueReturn,
	UseAsyncQueueTask,
} from "../types";

const promiseState = {
	aborted: "aborted",
	fulfilled: "fulfilled",
	pending: "pending",
	rejected: "rejected",
} as const satisfies Record<UseAsyncQueueResultState, UseAsyncQueueResultState>;

function noop(): void {}

function createAbortError(): Error {
	return new Error("aborted");
}

function createInitialResult(length: number): UseAsyncQueueResult<unknown>[] {
	return Array.from({ length }, () => ({
		state: promiseState.pending,
		data: null,
	}));
}

function runWithAbort<T>(
	promise: Promise<T>,
	abortSignal: AbortSignal | undefined,
): Promise<T> {
	if (abortSignal === undefined) {
		return promise;
	}

	return new Promise<T>((resolve, reject) => {
		const onAbort = () => {
			reject(createAbortError());
		};
		const removeAbortListener = () => {
			abortSignal.removeEventListener("abort", onAbort);
		};

		abortSignal.addEventListener("abort", onAbort, { once: true });
		promise.then(resolve, reject).finally(removeAbortListener);

		if (abortSignal.aborted) {
			onAbort();
		}
	});
}

/**
 * Asynchronous queue task controller.
 *
 * @param tasks Queue tasks.
 * @param options Queue options.
 */
export function useAsyncQueue<TTasks extends readonly UseAsyncQueueTask[]>(
	tasks: readonly [...TTasks],
	options: UseAsyncQueueOptions = {},
): UseAsyncQueueReturn<TTasks> {
	const {
		interrupt = true,
		onError = noop,
		onFinished = noop,
		signal: abortSignal,
	} = options;
	const activeIndex = signal(-1);
	const result = signal(
		createInitialResult(tasks.length) as UseAsyncQueueResultList<TTasks>,
	);

	const updateResult = (
		index: number,
		state: UseAsyncQueueResultState,
		data: unknown,
	) => {
		activeIndex.value = index;
		const nextResult = result.value.slice() as UseAsyncQueueResult<unknown>[];
		nextResult[index] =
			state === promiseState.pending ? { state, data: null } : { state, data };
		result.value = nextResult as UseAsyncQueueResultList<TTasks>;
	};

	const runTasks = async () => {
		let previousResult: unknown;

		for (let index = 0; index < tasks.length; index += 1) {
			if (abortSignal?.aborted) {
				const error = createAbortError();
				updateResult(index, promiseState.aborted, error);
				previousResult = error;
				continue;
			}

			const task = tasks[index] as (
				previousResult: unknown,
			) => unknown | Promise<unknown>;

			try {
				const taskResult = await runWithAbort(
					Promise.resolve(task(previousResult)),
					abortSignal,
				);

				if (abortSignal?.aborted) {
					throw createAbortError();
				}

				updateResult(index, promiseState.fulfilled, taskResult);
				previousResult = taskResult;

				if (index === tasks.length - 1) {
					onFinished();
				}
			} catch (error) {
				if (abortSignal?.aborted) {
					updateResult(index, promiseState.aborted, error);
					previousResult = error;
					continue;
				}

				updateResult(index, promiseState.rejected, error);
				previousResult = error;
				onError();

				if (index === tasks.length - 1 || interrupt) {
					onFinished();
				}

				if (interrupt) {
					return;
				}
			}
		}
	};

	if (tasks.length === 0) {
		onFinished();
	} else {
		void Promise.resolve().then(runTasks);
	}

	return {
		activeIndex: readonly(activeIndex),
		result: readonly(result),
	};
}
