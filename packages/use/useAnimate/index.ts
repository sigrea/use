import { computed, onMount, readonly, signal, watch } from "@sigrea/core";
import { defaultWindow, resolveTarget, resolveValue } from "../../shared";
import { tryOnScopeDispose } from "../tryOnScopeDispose";
import type {
	MaybeTarget,
	UseAnimateKeyframes,
	UseAnimateOptions,
	UseAnimateReturn,
	UseAnimateWindowLike,
} from "../types";

type AnimationSignalValue = Animation | undefined;
type AnimationEventName = "cancel" | "finish" | "remove";
type KeyframeEffectConstructor = {
	new (
		target: Element | null,
		keyframes: Keyframe[] | PropertyIndexedKeyframes | null,
		options?: number | KeyframeEffectOptions,
	): KeyframeEffect;
};
type KeyframeEffectLike = AnimationEffect & {
	setKeyframes?(keyframes: Keyframe[] | PropertyIndexedKeyframes | null): void;
};

const customOptionKeys = new Set<keyof UseAnimateOptions>([
	"window",
	"immediate",
	"commitStyles",
	"persist",
	"onReady",
	"onError",
]);

function isOptionsObject(
	options: number | UseAnimateOptions | undefined,
): options is UseAnimateOptions {
	return typeof options === "object" && options !== null;
}

function createAnimationOptions(
	options: number | UseAnimateOptions | undefined,
): number | KeyframeAnimationOptions | undefined {
	if (!isOptionsObject(options)) {
		return options;
	}

	const animationOptions: KeyframeAnimationOptions = {};
	for (const key of Object.keys(options) as Array<keyof UseAnimateOptions>) {
		if (!customOptionKeys.has(key)) {
			(animationOptions as Record<string, unknown>)[key] = options[key];
		}
	}

	return animationOptions;
}

function listenAnimation(
	animation: Animation,
	type: AnimationEventName,
	listener: (event: Event) => void,
): () => void {
	animation.addEventListener(type, listener, { passive: true });

	return () => {
		animation.removeEventListener(type, listener);
	};
}

/**
 * Reactive Web Animations API controls.
 *
 * @param target Element to animate.
 * @param keyframes Animation keyframes.
 * @param options Animation duration or options.
 */
export function useAnimate<
	TWindow extends UseAnimateWindowLike = UseAnimateWindowLike,
>(
	target: MaybeTarget<Element>,
	keyframes: UseAnimateKeyframes,
	options?: number | UseAnimateOptions<TWindow>,
): UseAnimateReturn {
	const config = isOptionsObject(options) ? options : {};
	const animationOptions = createAnimationOptions(options);
	const windowTarget =
		"window" in config && config.window !== undefined
			? config.window
			: (defaultWindow as MaybeTarget<TWindow> | undefined);
	const immediate = config.immediate ?? true;
	const commitStyles = config.commitStyles ?? false;
	const persist = config.persist ?? false;
	const onReady = config.onReady;
	const onError =
		config.onError ??
		((error: unknown) => {
			console.error(error);
		});

	const isSupported = signal(false);
	const animate = signal<AnimationSignalValue>(undefined);
	const pending = signal(false);
	const playState = signal<AnimationPlayState>(immediate ? "idle" : "paused");
	const replaceState = signal<AnimationReplaceState>("active");
	const startTimeValue = signal<CSSNumberish | null>(null);
	const currentTimeValue = signal<CSSNumberish | null>(null);
	const timelineValue = signal<AnimationTimeline | null>(null);
	const playbackRateValue = signal(
		isOptionsObject(options) && options.playbackRate !== undefined
			? options.playbackRate
			: 1,
	);

	let stopped = false;
	let rafId: number | undefined;
	let cancelRaf: ((handle: number) => void) | undefined;
	let animationCleanups: Array<() => void> = [];

	const currentWindow = () =>
		windowTarget === undefined
			? undefined
			: resolveTarget<TWindow>(windowTarget);

	const clearAnimationListeners = () => {
		for (const cleanup of animationCleanups) {
			cleanup();
		}
		animationCleanups = [];
	};

	const cancelFrame = () => {
		if (rafId === undefined) {
			return;
		}

		cancelRaf?.(rafId);
		rafId = undefined;
		cancelRaf = undefined;
	};

	const syncState = (animation = animate.value) => {
		if (animation === undefined) {
			pending.value = false;
			playState.value = immediate ? "idle" : "paused";
			replaceState.value = "active";
			startTimeValue.value = null;
			currentTimeValue.value = null;
			timelineValue.value = null;
			return;
		}

		pending.value = animation.pending;
		playState.value = animation.playState;
		replaceState.value = animation.replaceState;
		startTimeValue.value = animation.startTime;
		currentTimeValue.value = animation.currentTime;
		timelineValue.value = animation.timeline;
		playbackRateValue.value = animation.playbackRate;
	};

	const scheduleStateSync = () => {
		if (stopped || rafId !== undefined) {
			return;
		}

		const window = currentWindow();
		const request = window?.requestAnimationFrame
			? {
					cancel: window.cancelAnimationFrame?.bind(window),
					request: window.requestAnimationFrame.bind(window),
				}
			: typeof globalThis.requestAnimationFrame === "function"
				? {
						cancel:
							typeof globalThis.cancelAnimationFrame === "function"
								? globalThis.cancelAnimationFrame.bind(globalThis)
								: undefined,
						request: globalThis.requestAnimationFrame.bind(globalThis),
					}
				: undefined;
		if (request === undefined) {
			syncState();
			return;
		}

		cancelRaf = request.cancel;
		rafId = request.request(() => {
			rafId = undefined;
			cancelRaf = undefined;
			syncState();

			const animation = animate.value;
			if (
				animation !== undefined &&
				(animation.pending || animation.playState === "running")
			) {
				scheduleStateSync();
			}
		});
	};

	const stopStateSync = () => {
		syncState();
		cancelFrame();
	};

	const isElementSupported = (
		element: Element | undefined,
		window: TWindow | undefined,
	) => Boolean(window && element && typeof element.animate === "function");

	const getKeyframeEffectConstructor = (window: TWindow | undefined) => {
		const windowConstructor = (
			window as { KeyframeEffect?: KeyframeEffectConstructor } | undefined
		)?.KeyframeEffect;
		if (typeof windowConstructor === "function") {
			return windowConstructor;
		}
		if (typeof globalThis.KeyframeEffect === "function") {
			return globalThis.KeyframeEffect;
		}
		return undefined;
	};

	const disposeAnimation = (cancelAnimation: boolean) => {
		cancelFrame();
		clearAnimationListeners();
		const animation = animate.value;
		if (cancelAnimation && animation !== undefined) {
			try {
				animation.cancel();
			} catch (error) {
				onError(error);
			}
		}
		animate.value = undefined;
		syncState(undefined);
	};

	const createAnimation = (init = false) => {
		if (stopped) {
			return;
		}

		const element = resolveTarget(target);
		const window = currentWindow();
		const supported = isElementSupported(element, window);
		isSupported.value = supported;

		if (!supported || element === undefined) {
			disposeAnimation(true);
			return;
		}

		const previousAnimation = animate.value;
		const pausesNewAnimation =
			(init && !immediate && previousAnimation === undefined) ||
			previousAnimation?.playState === "paused";

		disposeAnimation(true);

		let nextAnimation: Animation;
		try {
			nextAnimation = element.animate(
				resolveValue(keyframes),
				animationOptions,
			);
		} catch (error) {
			onError(error);
			return;
		}

		animate.value = nextAnimation;

		try {
			if (persist) {
				nextAnimation.persist();
			}
			if (playbackRateValue.value !== 1) {
				nextAnimation.playbackRate = playbackRateValue.value;
			}
			if (pausesNewAnimation) {
				nextAnimation.pause();
			}
		} catch (error) {
			onError(error);
		}

		const syncPause = () => {
			stopStateSync();
		};
		animationCleanups = [
			listenAnimation(nextAnimation, "cancel", syncPause),
			listenAnimation(nextAnimation, "finish", syncPause),
			listenAnimation(nextAnimation, "remove", syncPause),
			listenAnimation(nextAnimation, "finish", () => {
				if (commitStyles) {
					try {
						nextAnimation.commitStyles();
					} catch (error) {
						onError(error);
					}
				}
			}),
		];

		syncState(nextAnimation);
		if (!pausesNewAnimation) {
			scheduleStateSync();
		}
		try {
			onReady?.(nextAnimation);
		} catch (error) {
			onError(error);
		}
	};

	const updateAnimationEffect = () => {
		if (stopped) {
			return;
		}

		const animation = animate.value;
		if (animation === undefined) {
			createAnimation(true);
			return;
		}

		const element = resolveTarget(target);
		const window = currentWindow();
		const supported = isElementSupported(element, window);
		isSupported.value = supported;

		if (!supported || element === undefined) {
			disposeAnimation(true);
			return;
		}

		const resolvedKeyframes = resolveValue(keyframes);
		const effect = animation.effect as KeyframeEffectLike | null;

		try {
			if (typeof effect?.setKeyframes === "function") {
				effect.setKeyframes(resolvedKeyframes);
			} else {
				const KeyframeEffect = getKeyframeEffectConstructor(window);
				if (KeyframeEffect === undefined) {
					createAnimation(false);
					return;
				}
				animation.effect = new KeyframeEffect(
					element,
					resolvedKeyframes,
					animationOptions,
				);
			}
			syncState(animation);
			if (animation.pending || animation.playState === "running") {
				scheduleStateSync();
			}
		} catch (error) {
			onError(error);
		}
	};

	const callAnimation = (
		callback: (animation: Animation) => void,
		resume: boolean,
	) => {
		if (animate.value === undefined) {
			createAnimation(false);
		}

		const animation = animate.value;
		if (animation === undefined) {
			return;
		}

		try {
			callback(animation);
			syncState(animation);
			if (resume) {
				scheduleStateSync();
			} else {
				cancelFrame();
			}
		} catch (error) {
			cancelFrame();
			syncState(animation);
			onError(error);
		}
	};

	const stopTargetWatch = watch(
		() => ({
			element: resolveTarget(target),
			window: currentWindow(),
		}),
		() => {
			createAnimation(true);
		},
		{ flush: "sync", immediate: false },
	);
	const stopKeyframesWatch = watch(
		() => resolveValue(keyframes),
		updateAnimationEffect,
		{ deep: true, flush: "sync", immediate: false },
	);

	let waitsForMount = false;
	try {
		// onMount only succeeds during molecule setup. Plain usage starts below.
		onMount(() => {
			createAnimation(true);

			return () => {
				disposeAnimation(true);
			};
		});
		waitsForMount = true;
	} catch {}
	if (!waitsForMount) {
		createAnimation(true);
	}

	const stop = () => {
		if (stopped) {
			return;
		}

		stopped = true;
		stopTargetWatch();
		stopKeyframesWatch();
		disposeAnimation(true);
	};

	tryOnScopeDispose(stop);

	const startTime = computed<CSSNumberish | null>({
		get: () => startTimeValue.value,
		set(value) {
			startTimeValue.value = value;
			if (animate.value !== undefined) {
				animate.value.startTime = value;
			}
		},
	});
	const currentTime = computed<CSSNumberish | null>({
		get: () => currentTimeValue.value,
		set(value) {
			currentTimeValue.value = value;
			if (animate.value !== undefined) {
				animate.value.currentTime = value;
				scheduleStateSync();
			}
		},
	});
	const timeline = computed<AnimationTimeline | null>({
		get: () => timelineValue.value,
		set(value) {
			timelineValue.value = value;
			if (animate.value !== undefined) {
				animate.value.timeline = value;
			}
		},
	});
	const playbackRate = computed<number>({
		get: () => playbackRateValue.value,
		set(value) {
			playbackRateValue.value = value;
			if (animate.value !== undefined) {
				animate.value.playbackRate = value;
			}
		},
	});

	return {
		isSupported: readonly(isSupported),
		animate: readonly(animate),
		play: () => {
			callAnimation((animation) => {
				animation.play();
			}, true);
		},
		pause: () => {
			callAnimation((animation) => {
				animation.pause();
			}, false);
		},
		reverse: () => {
			callAnimation((animation) => {
				animation.reverse();
			}, true);
		},
		finish: () => {
			callAnimation((animation) => {
				animation.finish();
			}, false);
		},
		cancel: () => {
			callAnimation((animation) => {
				animation.cancel();
			}, false);
		},
		pending: readonly(pending),
		playState: readonly(playState),
		replaceState: readonly(replaceState),
		startTime,
		currentTime,
		timeline,
		playbackRate,
		stop,
	};
}
