import { computed, readonly, signal, watch } from "@sigrea/core";
import type { Signal } from "@sigrea/core";

import { defaultWindow, resolveTarget, resolveValue } from "../../shared";
import { tryOnScopeDispose } from "../tryOnScopeDispose";
import type {
	CubicBezierPoints,
	EasingFunction,
	InterpolationFunction,
	MaybeTarget,
	MaybeValue,
	TransitionEasing,
	TransitionOptions,
	UseTransitionOptions,
	UseTransitionReturn,
	UseTransitionVector,
	UseTransitionWindowLike,
} from "../types";

const linear: EasingFunction = (value) => value;

const TransitionPresetPoints = {
	easeInSine: [0.12, 0, 0.39, 0],
	easeOutSine: [0.61, 1, 0.88, 1],
	easeInOutSine: [0.37, 0, 0.63, 1],
	easeInQuad: [0.11, 0, 0.5, 0],
	easeOutQuad: [0.5, 1, 0.89, 1],
	easeInOutQuad: [0.45, 0, 0.55, 1],
	easeInCubic: [0.32, 0, 0.67, 0],
	easeOutCubic: [0.33, 1, 0.68, 1],
	easeInOutCubic: [0.65, 0, 0.35, 1],
	easeInQuart: [0.5, 0, 0.75, 0],
	easeOutQuart: [0.25, 1, 0.5, 1],
	easeInOutQuart: [0.76, 0, 0.24, 1],
	easeInQuint: [0.64, 0, 0.78, 0],
	easeOutQuint: [0.22, 1, 0.36, 1],
	easeInOutQuint: [0.83, 0, 0.17, 1],
	easeInExpo: [0.7, 0, 0.84, 0],
	easeOutExpo: [0.16, 1, 0.3, 1],
	easeInOutExpo: [0.87, 0, 0.13, 1],
	easeInCirc: [0.55, 0, 1, 0.45],
	easeOutCirc: [0, 0.55, 0.45, 1],
	easeInOutCirc: [0.85, 0, 0.15, 1],
	easeInBack: [0.36, 0, 0.66, -0.56],
	easeOutBack: [0.34, 1.56, 0.64, 1],
	easeInOutBack: [0.68, -0.6, 0.32, 1.6],
} as const satisfies Record<string, CubicBezierPoints>;

/**
 * Common transitions.
 */
export const TransitionPresets = Object.assign(
	{ linear },
	TransitionPresetPoints,
) as Record<keyof typeof TransitionPresetPoints, CubicBezierPoints> & {
	linear: EasingFunction;
};

function createEasingFunction([
	p0,
	p1,
	p2,
	p3,
]: CubicBezierPoints): EasingFunction {
	const a = (a1: number, a2: number) => 1 - 3 * a2 + 3 * a1;
	const b = (a1: number, a2: number) => 3 * a2 - 6 * a1;
	const c = (a1: number) => 3 * a1;
	const calcBezier = (t: number, a1: number, a2: number) =>
		((a(a1, a2) * t + b(a1, a2)) * t + c(a1)) * t;
	const getSlope = (t: number, a1: number, a2: number) =>
		3 * a(a1, a2) * t * t + 2 * b(a1, a2) * t + c(a1);
	const getTforX = (x: number) => {
		let guess = x;

		for (let index = 0; index < 4; index += 1) {
			const slope = getSlope(guess, p0, p2);
			if (slope === 0) {
				return guess;
			}
			guess -= (calcBezier(guess, p0, p2) - x) / slope;
		}

		return guess;
	};

	return (x) => (p0 === p1 && p2 === p3 ? x : calcBezier(getTforX(x), p1, p3));
}

function lerp(from: number, to: number, alpha: number): number {
	return from + alpha * (to - from);
}

function defaultInterpolation<T>(from: T, to: T, alpha: number): T {
	const fromValue = resolveValue(from as MaybeValue<unknown>);
	const toValue = resolveValue(to as MaybeValue<unknown>);

	if (typeof fromValue === "number" && typeof toValue === "number") {
		return lerp(fromValue, toValue, alpha) as T;
	}

	if (Array.isArray(fromValue) && Array.isArray(toValue)) {
		return fromValue.map((value, index) =>
			lerp(
				resolveValue(value as MaybeValue<number>),
				resolveValue(toValue[index] as MaybeValue<number>),
				alpha,
			),
		) as T;
	}

	throw new TypeError(
		"Unknown transition type, specify an interpolation function.",
	);
}

function normalizeEasing(
	easing: TransitionOptions<unknown>["easing"],
): TransitionEasing {
	if (easing === undefined) {
		return linear;
	}

	if (typeof easing === "function" || Array.isArray(easing)) {
		return easing as TransitionEasing;
	}

	return resolveValue(easing as MaybeValue<TransitionEasing>);
}

function resolveEasing<T>(options: TransitionOptions<T>): EasingFunction {
	const normalized = normalizeEasing(options.easing);

	return typeof normalized === "function"
		? normalized
		: createEasingFunction(normalized);
}

function currentWindow<TWindow extends UseTransitionWindowLike>(
	windowOption: MaybeTarget<TWindow> | undefined,
	useDefaultWindow: boolean,
): TWindow | undefined {
	const windowTarget = useDefaultWindow
		? (defaultWindow as MaybeTarget<TWindow> | undefined)
		: windowOption;

	return windowTarget === undefined
		? undefined
		: (resolveTarget<TWindow | null | undefined>(windowTarget) ?? undefined);
}

function nextFrame(
	window: UseTransitionWindowLike | undefined,
	allowGlobalFallback: boolean,
	callback: FrameRequestCallback,
): boolean {
	const requestFrame =
		window?.requestAnimationFrame ??
		(allowGlobalFallback ? globalThis.requestAnimationFrame : undefined);
	if (typeof requestFrame !== "function") {
		return false;
	}

	requestFrame.call(window ?? globalThis, callback);
	return true;
}

function delay(ms: number): Promise<void> {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

/**
 * Transition from one value to another.
 */
export function transition<T, TWindow extends UseTransitionWindowLike>(
	source: Signal<T>,
	from: MaybeValue<T>,
	to: MaybeValue<T>,
	options: TransitionOptions<T, TWindow> = {},
): Promise<void> {
	const fromValue = resolveValue(from);
	const toValue = resolveValue(to);
	const duration = resolveValue(options.duration ?? 1000);
	const interpolation =
		typeof options.interpolation === "function"
			? options.interpolation
			: defaultInterpolation;
	const ease = resolveEasing(options);
	const useDefaultWindow =
		!("window" in options) || options.window === undefined;
	const window = currentWindow(options.window, useDefaultWindow);
	const startedAt = Date.now();
	const endAt = startedAt + duration;

	source.value = fromValue;

	if (!Number.isFinite(duration) || duration <= 0) {
		source.value = toValue;
		return Promise.resolve();
	}

	return new Promise((resolve) => {
		const tick = () => {
			if (options.abort?.()) {
				resolve();
				return;
			}

			const now = Date.now();
			if (now >= endAt) {
				source.value = toValue;
				resolve();
				return;
			}

			source.value = interpolation(
				fromValue,
				toValue,
				ease((now - startedAt) / duration),
			);

			if (!nextFrame(window, useDefaultWindow, tick)) {
				source.value = toValue;
				resolve();
			}
		};

		tick();
	});
}

export function useTransition<T extends readonly MaybeValue<number>[]>(
	source: readonly [...T],
	options?: UseTransitionOptions<UseTransitionVector<T>>,
): UseTransitionReturn<UseTransitionVector<T>>;
export function useTransition(
	source: MaybeValue<readonly number[]>,
	options?: UseTransitionOptions<number[]>,
): UseTransitionReturn<number[]>;
export function useTransition<T>(
	source: MaybeValue<T>,
	options?: UseTransitionOptions<T>,
): UseTransitionReturn<T>;

/**
 * Follow value with a transition.
 */
export function useTransition<T>(
	source: MaybeValue<T>,
	options: UseTransitionOptions<T> = {},
): UseTransitionReturn<T> {
	let currentId = 0;

	const sourceValue = (): T => {
		const value = resolveValue(source);
		if (options.interpolation === undefined && Array.isArray(value)) {
			return value.map((entry) =>
				resolveValue(entry as MaybeValue<unknown>),
			) as T;
		}

		return value;
	};
	const output = signal(sourceValue());
	const isDisabled = () => resolveValue(options.disabled ?? false);
	const startTransition = async (to: T) => {
		if (isDisabled()) {
			currentId += 1;
			output.value = to;
			return;
		}

		const id = ++currentId;
		const delayValue = resolveValue(options.delay ?? 0);
		if (delayValue > 0) {
			await delay(delayValue);
		}

		if (id !== currentId) {
			return;
		}

		options.onStarted?.();

		let manuallyAborted = false;
		await transition(output, output.value, to, {
			...options,
			abort: () => {
				if (id !== currentId) {
					return true;
				}

				if (options.abort?.()) {
					manuallyAborted = true;
					return true;
				}

				return false;
			},
		});

		if (id === currentId && !manuallyAborted) {
			options.onFinished?.();
		}
	};

	const stopSourceWatch = watch(
		sourceValue,
		(value) => {
			void startTransition(value);
		},
		{ deep: true },
	);
	const stopDisabledWatch = watch(isDisabled, (disabled) => {
		if (!disabled) {
			return;
		}

		currentId += 1;
		output.value = sourceValue();
	});

	tryOnScopeDispose(() => {
		currentId += 1;
		stopSourceWatch();
		stopDisabledWatch();
	});

	return readonly(
		computed(() => (isDisabled() ? sourceValue() : output.value)),
	) as UseTransitionReturn<T>;
}
