import { computed, deepSignal, readonly, signal, watch } from "@sigrea/core";
import type { Signal } from "@sigrea/core";

import { resolveValue } from "../../shared/resolveValue";
import type {
	MaybeValue,
	UseAsyncStateOptions,
	UseAsyncStateReturn,
	UseAsyncStateReturnBase,
	UseAsyncStateSource,
} from "../types";

interface AsyncState<T> {
	value: T;
}

function defaultOnError(error: unknown): void {
	if (typeof globalThis.reportError === "function") {
		globalThis.reportError(error);
	}
}

function noop(): void {}

function promiseTimeout(delay: number): Promise<void> {
	return new Promise((resolve) => {
		setTimeout(resolve, delay);
	});
}

function createState<T>(
	initialState: T,
	shallow: boolean,
): Signal<T> | AsyncState<T> {
	return shallow
		? signal(initialState)
		: (deepSignal({ value: initialState }) as AsyncState<T>);
}

/**
 * Reactive async state.
 *
 * @param source Promise or async function to resolve.
 * @param initialState Initial state before the first execution finishes.
 * @param options Async state options.
 */
export function useAsyncState<Data, Params extends unknown[] = []>(
	source: UseAsyncStateSource<Data, Params>,
	initialState: MaybeValue<Data>,
	options: UseAsyncStateOptions<Data> = {},
): UseAsyncStateReturn<Data, Params> {
	const {
		delay = 0,
		immediate = true,
		onError = defaultOnError,
		onSuccess = noop,
		resetOnExecute = true,
		shallow = true,
		throwError = false,
	} = options;
	const resolveInitialState = () => resolveValue(initialState);
	const current = createState(resolveInitialState(), shallow);
	const isReady = signal(false);
	const isLoading = signal(false);
	const error = signal<unknown | undefined>(undefined);
	let executionsCount = 0;

	const execute = async (
		executeDelay = 0,
		...args: Params
	): Promise<Data | undefined> => {
		executionsCount += 1;
		const executionId = executionsCount;

		if (resetOnExecute) {
			current.value = resolveInitialState();
		}
		error.value = undefined;
		isReady.value = false;
		isLoading.value = true;

		if (executeDelay > 0) {
			await promiseTimeout(executeDelay);
		}

		const promise =
			typeof source === "function"
				? (source as (...args: Params) => Promise<Data>)(...args)
				: source;

		try {
			const data = await promise;
			if (executionId === executionsCount) {
				current.value = data;
				isReady.value = true;
			}
			onSuccess(data);
			return data;
		} catch (caughtError) {
			if (executionId === executionsCount) {
				error.value = caughtError;
			}
			onError(caughtError);
			if (throwError) {
				throw caughtError;
			}
		} finally {
			if (executionId === executionsCount) {
				isLoading.value = false;
			}
		}

		return undefined;
	};
	const state = readonly(computed(() => current.value));
	const shell: UseAsyncStateReturnBase<Data, Params> = {
		state,
		isReady: readonly(isReady),
		isLoading: readonly(isLoading),
		error: readonly(error),
		execute,
		executeImmediate: (...args) => execute(0, ...args),
	};
	const waitUntilLoaded = () =>
		new Promise<UseAsyncStateReturnBase<Data, Params>>((resolve) => {
			if (!isLoading.value) {
				resolve(shell);
				return;
			}

			const stop = watch(isLoading, (value) => {
				if (!value) {
					stop();
					resolve(shell);
				}
			});
		});

	if (immediate) {
		void execute(delay, ...([] as unknown as Params));
	}

	return {
		...shell,
		// biome-ignore lint/suspicious/noThenProperty: VueUse-compatible await support.
		then(onFulfilled, onRejected) {
			return waitUntilLoaded().then(onFulfilled, onRejected);
		},
	};
}
