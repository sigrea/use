import {
	computed,
	deepSignal,
	isSignal,
	readonly,
	signal,
	watchEffect,
} from "@sigrea/core";
import type { ReadonlySignal, Signal } from "@sigrea/core";

import type {
	AsyncComputedCancelCallback,
	AsyncComputedEvaluationCallback,
	AsyncComputedOnCancel,
	AsyncComputedOptions,
	AsyncComputedOptionsOrSignal,
} from "../types";

interface AsyncComputedState<T> {
	value: T;
}

function defaultOnError(error: unknown): void {
	if (typeof globalThis.reportError === "function") {
		globalThis.reportError(error);
	}
}

function resolveOptions(
	optionsOrSignal?: AsyncComputedOptionsOrSignal,
): AsyncComputedOptions {
	if (isSignal(optionsOrSignal)) {
		return { evaluating: optionsOrSignal };
	}
	return optionsOrSignal ?? {};
}

function createCurrent<T>(
	initialState: T,
	shallow: boolean,
): Signal<T> | AsyncComputedState<T> {
	return shallow
		? signal(initialState)
		: (deepSignal({ value: initialState }) as AsyncComputedState<T>);
}

export function computedAsync<T>(
	evaluationCallback: AsyncComputedEvaluationCallback<T>,
	initialState: T,
	options?: AsyncComputedOptionsOrSignal,
): ReadonlySignal<T>;
export function computedAsync<T>(
	evaluationCallback: AsyncComputedEvaluationCallback<T>,
	initialState?: undefined,
	options?: AsyncComputedOptionsOrSignal,
): ReadonlySignal<T | undefined>;
export function computedAsync<T>(
	evaluationCallback: AsyncComputedEvaluationCallback<T>,
	initialState?: T,
	optionsOrSignal?: AsyncComputedOptionsOrSignal,
): ReadonlySignal<T | undefined> {
	const {
		evaluating,
		flush = "sync",
		lazy = false,
		onError = defaultOnError,
		shallow = true,
	} = resolveOptions(optionsOrSignal);
	const started = signal(!lazy);
	const current = createCurrent<T | undefined>(initialState, shallow);
	let counter = 0;

	watchEffect(
		async (onCleanup) => {
			if (!started.value) {
				return;
			}

			counter += 1;
			const counterAtStart = counter;
			const cancelCallbacks: AsyncComputedCancelCallback[] = [];
			let canceled = false;
			let hasFinished = false;

			const onCancel: AsyncComputedOnCancel = (cancelCallback) => {
				if (canceled && !hasFinished) {
					cancelCallback();
					return;
				}
				cancelCallbacks.push(cancelCallback);
			};

			onCleanup(() => {
				canceled = true;
				if (evaluating !== undefined) {
					evaluating.value = false;
				}
				if (!hasFinished) {
					for (const cancelCallback of cancelCallbacks) {
						cancelCallback();
					}
				}
			});

			if (evaluating !== undefined) {
				evaluating.value = true;
			}

			try {
				const result = await evaluationCallback(onCancel);
				if (!canceled && counterAtStart === counter) {
					current.value = result;
				}
			} catch (error) {
				onError(error);
			} finally {
				hasFinished = true;
				if (counterAtStart === counter && evaluating !== undefined) {
					evaluating.value = false;
				}
			}
		},
		{ flush },
	);

	return readonly(
		computed(() => {
			if (lazy) {
				started.value = true;
			}
			return current.value;
		}),
	);
}
