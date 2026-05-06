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
	SpeechSynthesisErrorEventLike,
	SpeechSynthesisEventLike,
	SpeechSynthesisLike,
	SpeechSynthesisUtteranceConstructorLike,
	SpeechSynthesisUtteranceLike,
	SpeechSynthesisVoiceLike,
	UseSpeechSynthesisOptions,
	UseSpeechSynthesisReturn,
	UseSpeechSynthesisWindowLike,
	UseSpeechSynthesisWindowOptions,
} from "../types";

type UseSpeechSynthesisReturnForWindow<
	TWindow extends UseSpeechSynthesisWindowLike,
> = TWindow extends UseSpeechSynthesisWindowLike<
	infer TVoice,
	infer TUtterance,
	infer _TSynthesis
>
	? TVoice extends SpeechSynthesisVoiceLike
		? TUtterance extends SpeechSynthesisUtteranceLike<TVoice>
			? UseSpeechSynthesisReturn<TVoice, TUtterance>
			: UseSpeechSynthesisReturn
		: UseSpeechSynthesisReturn
	: UseSpeechSynthesisReturn;

function getSpeechSynthesis<
	TVoice extends SpeechSynthesisVoiceLike,
	TUtterance extends SpeechSynthesisUtteranceLike<TVoice>,
>(
	window: UseSpeechSynthesisWindowLike<TVoice, TUtterance> | null | undefined,
): SpeechSynthesisLike<TVoice, TUtterance> | undefined {
	return window?.speechSynthesis;
}

function getSpeechSynthesisUtteranceConstructor<
	TVoice extends SpeechSynthesisVoiceLike,
	TUtterance extends SpeechSynthesisUtteranceLike<TVoice>,
>(
	window: UseSpeechSynthesisWindowLike<TVoice, TUtterance> | null | undefined,
): SpeechSynthesisUtteranceConstructorLike<TVoice, TUtterance> | undefined {
	return window?.SpeechSynthesisUtterance;
}

function isSpeechSynthesisSupported<
	TVoice extends SpeechSynthesisVoiceLike,
	TUtterance extends SpeechSynthesisUtteranceLike<TVoice>,
>(
	window: UseSpeechSynthesisWindowLike<TVoice, TUtterance> | null | undefined,
): boolean {
	const synth = getSpeechSynthesis(window);

	return (
		synth !== undefined &&
		typeof window?.SpeechSynthesisUtterance === "function" &&
		typeof synth.speak === "function" &&
		typeof synth.cancel === "function" &&
		typeof synth.pause === "function" &&
		typeof synth.resume === "function" &&
		typeof synth.getVoices === "function"
	);
}

/**
 * Reactive SpeechSynthesis controls.
 */
export function useSpeechSynthesis<
	TWindow extends UseSpeechSynthesisWindowLike,
>(
	text: MaybeValue<string>,
	options: UseSpeechSynthesisWindowOptions<TWindow>,
): UseSpeechSynthesisReturnForWindow<TWindow>;
export function useSpeechSynthesis<
	TVoice extends SpeechSynthesisVoiceLike = SpeechSynthesisVoiceLike,
	TUtterance extends
		SpeechSynthesisUtteranceLike<TVoice> = SpeechSynthesisUtteranceLike<TVoice>,
	TWindow extends UseSpeechSynthesisWindowLike<
		TVoice,
		TUtterance
	> = UseSpeechSynthesisWindowLike<TVoice, TUtterance>,
>(
	text?: MaybeValue<string>,
	options?: UseSpeechSynthesisOptions<TVoice, TUtterance, TWindow>,
): UseSpeechSynthesisReturn<TVoice, TUtterance>;
export function useSpeechSynthesis<
	TVoice extends SpeechSynthesisVoiceLike = SpeechSynthesisVoiceLike,
	TUtterance extends
		SpeechSynthesisUtteranceLike<TVoice> = SpeechSynthesisUtteranceLike<TVoice>,
	TWindow extends UseSpeechSynthesisWindowLike<
		TVoice,
		TUtterance
	> = UseSpeechSynthesisWindowLike<TVoice, TUtterance>,
>(
	text: MaybeValue<string> = "",
	options: UseSpeechSynthesisOptions<TVoice, TUtterance, TWindow> = {},
): UseSpeechSynthesisReturn<TVoice, TUtterance> {
	const windowTarget: MaybeTarget<TWindow> | undefined =
		"window" in options && options.window !== undefined
			? options.window
			: (defaultWindow as MaybeTarget<TWindow> | undefined);
	const lang: MaybeValue<string> = options.lang ?? "en-US";
	const pitch: MaybeValue<number> = options.pitch ?? 1;
	const rate: MaybeValue<number> = options.rate ?? 1;
	const volume: MaybeValue<number> = options.volume ?? 1;
	const isSupported = signal(false);
	const isPlaying = signal(false);
	const status = signal<"init" | "play" | "pause" | "end">("init");
	const utterance = signal<TUtterance | undefined>(undefined);
	const error = signal<unknown | null>(null);
	const voices = signal<readonly TVoice[]>([]);
	const synthesis = signal<SpeechSynthesisLike<TVoice, TUtterance> | undefined>(
		undefined,
	);
	let utteranceCleanups: Array<() => void> = [];
	let cleanupVoicesChanged = () => {};

	const currentWindow = () =>
		windowTarget === undefined
			? undefined
			: resolveTarget<TWindow>(windowTarget);
	const currentSynthesis = () => synthesis.value;
	const syncSupport = (window: TWindow | null | undefined) => {
		isSupported.value = isSpeechSynthesisSupported(window);
	};
	const clearUtteranceCleanups = () => {
		for (const cleanup of utteranceCleanups) {
			cleanup();
		}
		utteranceCleanups = [];
	};
	const cleanupVoices = () => {
		cleanupVoicesChanged();
		cleanupVoicesChanged = () => {};
	};
	const syncVoices = (
		synth: SpeechSynthesisLike<TVoice, TUtterance> | undefined,
	) => {
		if (synth === undefined) {
			voices.value = [];
			return;
		}

		try {
			voices.value = Array.from(synth.getVoices());
		} catch (caughtError) {
			voices.value = [];
			error.value = caughtError;
		}
	};
	const configureUtterance = (source: TUtterance) => {
		source.lang = resolveValue(lang);
		source.voice = resolveValue(options.voice) ?? null;
		source.pitch = resolveValue(pitch);
		source.rate = resolveValue(rate);
		source.volume = resolveValue(volume);
	};
	const bindUtteranceEvents = (source: TUtterance) => {
		utteranceCleanups = [
			listen(
				source,
				"start",
				() => {
					if (utterance.value !== source) {
						return;
					}

					isPlaying.value = true;
					status.value = "play";
				},
				{ passive: true },
			),
			listen(
				source,
				"pause",
				() => {
					if (utterance.value !== source) {
						return;
					}

					isPlaying.value = false;
					status.value = "pause";
				},
				{ passive: true },
			),
			listen(
				source,
				"resume",
				() => {
					if (utterance.value !== source) {
						return;
					}

					isPlaying.value = true;
					status.value = "play";
				},
				{ passive: true },
			),
			listen(
				source,
				"end",
				() => {
					if (utterance.value !== source) {
						return;
					}

					isPlaying.value = false;
					status.value = "end";
				},
				{ passive: true },
			),
			listen(
				source,
				"error",
				(event) => {
					if (utterance.value !== source) {
						return;
					}

					isPlaying.value = false;
					status.value = "end";
					error.value = event as SpeechSynthesisErrorEventLike<TUtterance>;
				},
				{ passive: true },
			),
			listen(
				source,
				"boundary",
				(event) => {
					if (utterance.value !== source) {
						return;
					}

					options.onBoundary?.(event as SpeechSynthesisEventLike<TUtterance>);
				},
				{ passive: true },
			),
		];
	};
	const createUtterance = (
		window: TWindow | null | undefined,
	): TUtterance | undefined => {
		syncSupport(window);

		const SpeechSynthesisUtterance = getSpeechSynthesisUtteranceConstructor<
			TVoice,
			TUtterance
		>(window);
		if (!isSupported.value || SpeechSynthesisUtterance === undefined) {
			clearUtteranceCleanups();
			utterance.value = undefined;
			return undefined;
		}

		clearUtteranceCleanups();

		try {
			const nextUtterance = new SpeechSynthesisUtterance(resolveValue(text));
			configureUtterance(nextUtterance);
			utterance.value = nextUtterance;
			bindUtteranceEvents(nextUtterance);
			return nextUtterance;
		} catch (caughtError) {
			utterance.value = undefined;
			error.value = caughtError;
			return undefined;
		}
	};
	const setupSynthesis = (window: TWindow | null | undefined) => {
		const previousSynthesis = synthesis.value;
		const nextSynthesis = getSpeechSynthesis(window);

		if (
			previousSynthesis !== undefined &&
			previousSynthesis !== nextSynthesis
		) {
			try {
				previousSynthesis.cancel();
			} catch (caughtError) {
				error.value = caughtError;
			}
		}

		cleanupVoices();
		syncSupport(window);
		synthesis.value = isSupported.value ? nextSynthesis : undefined;
		syncVoices(synthesis.value);

		if (synthesis.value !== undefined) {
			cleanupVoicesChanged = listen(
				synthesis.value,
				"voiceschanged",
				() => {
					syncVoices(synthesis.value);
				},
				{ passive: true },
			);
		}

		isPlaying.value = false;
		if (
			previousSynthesis !== undefined &&
			previousSynthesis !== nextSynthesis
		) {
			status.value = "end";
		}
		createUtterance(window);
	};
	const speak = () => {
		const window = currentWindow();
		syncSupport(window);

		const synth = currentSynthesis();
		if (!isSupported.value || synth === undefined) {
			return;
		}

		const nextUtterance = createUtterance(window);
		if (nextUtterance === undefined) {
			return;
		}

		error.value = null;
		status.value = "init";

		try {
			synth.cancel();
			synth.resume();
			synth.speak(nextUtterance);
		} catch (caughtError) {
			isPlaying.value = false;
			status.value = "end";
			error.value = caughtError;
		}
	};
	const cancel = () => {
		const synth = currentSynthesis();
		if (synth === undefined) {
			isPlaying.value = false;
			return;
		}

		try {
			synth.cancel();
		} catch (caughtError) {
			error.value = caughtError;
		}

		isPlaying.value = false;
		status.value = "end";
	};
	const stop = cancel;
	const pause = () => {
		const synth = currentSynthesis();
		if (synth === undefined || status.value !== "play") {
			return;
		}

		try {
			synth.pause();
			isPlaying.value = false;
			status.value = "pause";
		} catch (caughtError) {
			error.value = caughtError;
		}
	};
	const resume = () => {
		const synth = currentSynthesis();
		if (synth === undefined || status.value !== "pause") {
			return;
		}

		try {
			synth.resume();
			isPlaying.value = true;
			status.value = "play";
		} catch (caughtError) {
			isPlaying.value = false;
			error.value = caughtError;
		}
	};
	const toggle = (value = !isPlaying.value) => {
		if (value) {
			if (status.value === "pause") {
				resume();
				return;
			}

			speak();
			return;
		}

		pause();
	};
	const stopWatch = watch(
		() => ({
			lang: resolveValue(lang),
			pitch: resolveValue(pitch),
			rate: resolveValue(rate),
			text: resolveValue(text),
			voice: resolveValue(options.voice),
			volume: resolveValue(volume),
			window: currentWindow(),
		}),
		({ window }, previous) => {
			if (previous === undefined || window !== previous.window) {
				setupSynthesis(window);
				return;
			}

			if (!isPlaying.value && status.value !== "pause") {
				createUtterance(window);
			}
		},
		{ immediate: true, flush: "sync" },
	);
	const dispose = () => {
		stopWatch();
		stop();
		cleanupVoices();
		clearUtteranceCleanups();
		synthesis.value = undefined;
		utterance.value = undefined;
		voices.value = [];
	};

	tryOnScopeDispose(dispose);

	return {
		isSupported: readonly(isSupported),
		isPlaying: readonly(isPlaying),
		status: readonly(status),
		utterance: readonly(utterance),
		error: readonly(error),
		voices: readonly(voices),
		speak,
		cancel,
		stop,
		toggle,
		pause,
		resume,
	};
}
