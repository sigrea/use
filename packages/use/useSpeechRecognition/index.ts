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
	SpeechRecognitionConstructorLike,
	SpeechRecognitionEventLike,
	SpeechRecognitionForWindow,
	SpeechRecognitionLike,
	SpeechRecognitionResultLike,
	UseSpeechRecognitionOptions,
	UseSpeechRecognitionReturn,
	UseSpeechRecognitionWindowLike,
	UseSpeechRecognitionWindowOptions,
} from "../types";

function getSpeechRecognitionConstructor<
	TSpeechRecognition extends SpeechRecognitionLike,
>(
	window: UseSpeechRecognitionWindowLike<TSpeechRecognition> | null | undefined,
): SpeechRecognitionConstructorLike<TSpeechRecognition> | undefined {
	return window?.SpeechRecognition ?? window?.webkitSpeechRecognition;
}

function isSpeechRecognitionSupported<
	TSpeechRecognition extends SpeechRecognitionLike,
>(
	window: UseSpeechRecognitionWindowLike<TSpeechRecognition> | null | undefined,
): boolean {
	return typeof getSpeechRecognitionConstructor(window) === "function";
}

function getResultAlternative(result: SpeechRecognitionResultLike | undefined) {
	return result?.[0] ?? result?.item?.(0);
}

function resolveRecognitionResults(event: SpeechRecognitionEventLike): {
	isFinal: boolean;
	transcript: string;
} {
	const transcripts: string[] = [];
	let allFinal = event.results.length > 0;

	for (let index = 0; index < event.results.length; index += 1) {
		const currentResult = event.results[index] ?? event.results.item?.(index);

		if (currentResult === undefined) {
			allFinal = false;
			continue;
		}

		if (!currentResult.isFinal) {
			allFinal = false;
		}

		transcripts.push(getResultAlternative(currentResult)?.transcript ?? "");
	}

	return {
		isFinal: allFinal,
		transcript: transcripts.join(""),
	};
}

/**
 * Reactive SpeechRecognition controls.
 */
export function useSpeechRecognition<
	TWindow extends UseSpeechRecognitionWindowLike<SpeechRecognitionLike>,
>(
	options: UseSpeechRecognitionWindowOptions<TWindow>,
): UseSpeechRecognitionReturn<SpeechRecognitionForWindow<TWindow>>;
export function useSpeechRecognition<
	TSpeechRecognition extends SpeechRecognitionLike = SpeechRecognitionLike,
	TWindow extends
		UseSpeechRecognitionWindowLike<TSpeechRecognition> = UseSpeechRecognitionWindowLike<TSpeechRecognition>,
>(
	options?: UseSpeechRecognitionOptions<TSpeechRecognition, TWindow>,
): UseSpeechRecognitionReturn<TSpeechRecognition>;
export function useSpeechRecognition<
	TSpeechRecognition extends SpeechRecognitionLike = SpeechRecognitionLike,
	TWindow extends
		UseSpeechRecognitionWindowLike<TSpeechRecognition> = UseSpeechRecognitionWindowLike<TSpeechRecognition>,
>(
	options: UseSpeechRecognitionOptions<TSpeechRecognition, TWindow> = {},
): UseSpeechRecognitionReturn<TSpeechRecognition> {
	const windowTarget: MaybeTarget<TWindow> | undefined =
		"window" in options && options.window !== undefined
			? options.window
			: (defaultWindow as MaybeTarget<TWindow> | undefined);
	const lang: MaybeValue<string> = options.lang ?? "en-US";
	const continuous = options.continuous ?? true;
	const interimResults = options.interimResults ?? true;
	const maxAlternatives = options.maxAlternatives ?? 1;
	const isSupported = signal(false);
	const isListening = signal(false);
	const isFinal = signal(false);
	const result = signal("");
	const error = signal<unknown | null>(null);
	const recognition = signal<TSpeechRecognition | undefined>(undefined);
	let eventCleanups: Array<() => void> = [];

	const currentWindow = () =>
		windowTarget === undefined
			? undefined
			: resolveTarget<TWindow>(windowTarget);
	const syncSupport = (window: TWindow | null | undefined) => {
		isSupported.value = isSpeechRecognitionSupported(window);
	};
	const clearEventCleanups = () => {
		for (const cleanup of eventCleanups) {
			cleanup();
		}
		eventCleanups = [];
	};
	const configureRecognition = (source: TSpeechRecognition) => {
		source.continuous = continuous;
		source.interimResults = interimResults;
		source.lang = resolveValue(lang);
		source.maxAlternatives = maxAlternatives;
	};
	const clearRecognition = (shouldStop: boolean) => {
		const currentRecognition = recognition.value;
		const wasListening = isListening.value;

		clearEventCleanups();
		recognition.value = undefined;
		isListening.value = false;

		if (shouldStop && wasListening) {
			try {
				currentRecognition?.stop();
			} catch (caughtError) {
				error.value = caughtError;
			}
		}
	};
	const bindRecognitionEvents = (source: TSpeechRecognition) => {
		eventCleanups = [
			listen(
				source,
				"start",
				() => {
					if (recognition.value !== source) {
						return;
					}

					isListening.value = true;
					isFinal.value = false;
				},
				{ passive: true },
			),
			listen(
				source,
				"result",
				(event) => {
					if (recognition.value !== source) {
						return;
					}

					const recognitionEvent = event as SpeechRecognitionEventLike;
					const resolvedResult = resolveRecognitionResults(recognitionEvent);

					isFinal.value = resolvedResult.isFinal;
					result.value = resolvedResult.transcript;
					error.value = null;
				},
				{ passive: true },
			),
			listen(
				source,
				"error",
				(event) => {
					if (recognition.value !== source) {
						return;
					}

					error.value = event;
				},
				{ passive: true },
			),
			listen(
				source,
				"end",
				() => {
					if (recognition.value !== source) {
						return;
					}

					isListening.value = false;
					source.lang = resolveValue(lang);
				},
				{ passive: true },
			),
		];
	};
	const createRecognition = (
		window: TWindow | null | undefined,
	): TSpeechRecognition | undefined => {
		syncSupport(window);

		const SpeechRecognition = getSpeechRecognitionConstructor(window);
		if (SpeechRecognition === undefined) {
			clearRecognition(true);
			return undefined;
		}

		clearRecognition(true);

		try {
			const nextRecognition = new SpeechRecognition();
			configureRecognition(nextRecognition);
			recognition.value = nextRecognition;
			bindRecognitionEvents(nextRecognition);
			return nextRecognition;
		} catch (caughtError) {
			error.value = caughtError;
			return undefined;
		}
	};
	const getCurrentRecognition = () =>
		recognition.value ?? createRecognition(currentWindow());
	const start = () => {
		if (isListening.value) {
			return;
		}

		const currentRecognition = getCurrentRecognition();
		if (currentRecognition === undefined) {
			return;
		}

		configureRecognition(currentRecognition);
		isListening.value = true;
		isFinal.value = false;
		error.value = null;

		try {
			currentRecognition.start();
		} catch (caughtError) {
			isListening.value = false;
			error.value = caughtError;
		}
	};
	const stop = () => {
		if (!isListening.value) {
			return;
		}

		isListening.value = false;

		try {
			recognition.value?.stop();
		} catch (caughtError) {
			error.value = caughtError;
		}
	};
	const abort = () => {
		if (!isListening.value) {
			return;
		}

		isListening.value = false;

		try {
			recognition.value?.abort();
		} catch (caughtError) {
			error.value = caughtError;
		}
	};
	const toggle = (value = !isListening.value) => {
		if (value) {
			start();
			return;
		}

		stop();
	};
	const stopWatch = watch(
		() => ({
			lang: resolveValue(lang),
			window: currentWindow(),
		}),
		({ lang: currentLang, window }, previous) => {
			syncSupport(window);

			if (previous === undefined || window !== previous.window) {
				createRecognition(window);
				return;
			}

			const currentRecognition = recognition.value;
			if (currentRecognition !== undefined && !isListening.value) {
				currentRecognition.lang = currentLang;
			}
		},
		{ immediate: true, flush: "sync" },
	);

	tryOnScopeDispose(() => {
		stopWatch();
		stop();
		clearEventCleanups();
		recognition.value = undefined;
	});

	return {
		isSupported: readonly(isSupported),
		isListening: readonly(isListening),
		isFinal: readonly(isFinal),
		recognition: readonly(recognition),
		result: readonly(result),
		error: readonly(error),
		start,
		stop,
		abort,
		toggle,
	};
}
