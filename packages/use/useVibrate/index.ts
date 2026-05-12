import { readonly, signal, watch } from "@sigrea/core";

import { defaultNavigator, resolveValue } from "../../shared";
import { tryOnScopeDispose } from "../tryOnScopeDispose";
import type {
	MaybeValue,
	UseVibrateNavigatorLike,
	UseVibrateOptions,
	UseVibratePattern,
	UseVibrateReturn,
} from "../types";
import { useIntervalFn } from "../useIntervalFn";

type SupportedVibrateNavigator = UseVibrateNavigatorLike & {
	vibrate(pattern: number | number[]): boolean;
};

function isVibrateNavigator(
	navigator: UseVibrateNavigatorLike | null | undefined,
): navigator is SupportedVibrateNavigator {
	return typeof navigator?.vibrate === "function";
}

function toVibratePattern(pattern: UseVibratePattern): number | number[] {
	return typeof pattern === "number" ? pattern : [...pattern];
}

function isCancelPattern(pattern: number | number[]): boolean {
	return (
		pattern === 0 ||
		(Array.isArray(pattern) && pattern.every((value) => value === 0))
	);
}

/**
 * Reactive Vibration API controls.
 */
export function useVibrate<
	TNavigator extends UseVibrateNavigatorLike = UseVibrateNavigatorLike,
>(options: UseVibrateOptions<TNavigator> = {}): UseVibrateReturn {
	const navigatorTarget: MaybeValue<TNavigator | null | undefined> =
		"navigator" in options
			? options.navigator
			: (defaultNavigator as TNavigator | undefined);
	const pattern = signal<UseVibratePattern>(
		resolveValue(options.pattern ?? []),
	);
	const isSupported = signal(false);
	let activeNavigator: SupportedVibrateNavigator | undefined;

	const currentNavigator = () => resolveValue(navigatorTarget);
	const syncSupport = (navigator = currentNavigator()) => {
		isSupported.value = isVibrateNavigator(navigator);
	};
	const cancelActiveVibration = () => {
		const navigator = activeNavigator;
		if (navigator === undefined) {
			return;
		}

		navigator.vibrate(0);
		activeNavigator = undefined;
	};
	const vibrate = (nextPattern: UseVibratePattern = pattern.value): void => {
		const navigator = currentNavigator();
		const nextVibratePattern = toVibratePattern(nextPattern);
		const shouldCancel = isCancelPattern(nextVibratePattern);
		const previousActiveNavigator = activeNavigator;
		if (shouldCancel) {
			cancelActiveVibration();
		}
		if (!isVibrateNavigator(navigator)) {
			return;
		}
		if (shouldCancel && navigator === previousActiveNavigator) {
			return;
		}
		if (
			!shouldCancel &&
			activeNavigator !== undefined &&
			activeNavigator !== navigator
		) {
			cancelActiveVibration();
		}

		navigator.vibrate(nextVibratePattern);
		activeNavigator = shouldCancel ? undefined : navigator;
	};
	const intervalControls =
		options.scheduler?.(vibrate) ??
		("interval" in options
			? useIntervalFn(vibrate, options.interval ?? 0, {
					immediate: false,
					immediateCallback: false,
				})
			: undefined);
	const stop = (): void => {
		const previousActiveNavigator = activeNavigator;
		cancelActiveVibration();
		const navigator = currentNavigator();
		if (
			isVibrateNavigator(navigator) &&
			navigator !== previousActiveNavigator
		) {
			navigator.vibrate(0);
		}
		intervalControls?.pause();
	};

	const stopPatternWatch =
		"pattern" in options
			? watch(
					() => resolveValue(options.pattern ?? []),
					(value) => {
						pattern.value = value;
					},
					{ deep: true, flush: "sync" },
				)
			: undefined;
	const stopSupportWatch = watch(
		currentNavigator,
		(navigator, previousNavigator) => {
			if (
				previousNavigator !== undefined &&
				previousNavigator !== navigator &&
				activeNavigator === previousNavigator
			) {
				cancelActiveVibration();
			}
			syncSupport(navigator);
		},
		{
			immediate: true,
			flush: "sync",
		},
	);

	tryOnScopeDispose(() => {
		stopPatternWatch?.();
		stopSupportWatch();
		stop();
	});

	return {
		isSupported: readonly(isSupported),
		pattern,
		intervalControls,
		vibrate,
		stop,
	};
}
