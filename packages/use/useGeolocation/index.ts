import { readonly, signal, watch } from "@sigrea/core";

import { defaultNavigator, resolveValue } from "../../shared";
import { bindAutoStart } from "../internal";
import { tryOnScopeDispose } from "../tryOnScopeDispose";
import type {
	MaybeValue,
	NavigatorLike,
	UseGeolocationCoordinates,
	UseGeolocationNavigatorLike,
	UseGeolocationOptions,
	UseGeolocationPositionLike,
	UseGeolocationReturn,
} from "../types";

type SupportedGeolocationNavigator = UseGeolocationNavigatorLike & {
	readonly geolocation: {
		clearWatch(watchId: number): void;
		watchPosition(
			successCallback: PositionCallback,
			errorCallback?: PositionErrorCallback | null,
			options?: PositionOptions,
		): number;
	};
};

function isGeolocationNavigator(
	navigator: NavigatorLike | null | undefined,
): navigator is SupportedGeolocationNavigator {
	const geolocation = (navigator as UseGeolocationNavigatorLike | undefined)
		?.geolocation;

	return (
		typeof geolocation?.watchPosition === "function" &&
		typeof geolocation.clearWatch === "function"
	);
}

function cloneCoordinates(
	coordinates: UseGeolocationCoordinates,
): UseGeolocationCoordinates {
	return {
		accuracy: coordinates.accuracy,
		altitude: coordinates.altitude,
		altitudeAccuracy: coordinates.altitudeAccuracy,
		heading: coordinates.heading,
		latitude: coordinates.latitude,
		longitude: coordinates.longitude,
		speed: coordinates.speed,
	};
}

function positionOptionsFrom(options: UseGeolocationOptions): PositionOptions {
	const positionOptions: PositionOptions = {};
	if ("enableHighAccuracy" in options) {
		positionOptions.enableHighAccuracy = options.enableHighAccuracy;
	}
	if ("maximumAge" in options) {
		positionOptions.maximumAge = options.maximumAge;
	}
	if ("timeout" in options) {
		positionOptions.timeout = options.timeout;
	}

	return positionOptions;
}

/**
 * Reactive Geolocation API.
 */
export function useGeolocation<
	TNavigator extends UseGeolocationNavigatorLike = UseGeolocationNavigatorLike,
>(options: UseGeolocationOptions<TNavigator> = {}): UseGeolocationReturn {
	const navigatorTarget: MaybeValue<TNavigator | null | undefined> =
		"navigator" in options
			? options.navigator
			: (defaultNavigator as TNavigator | undefined);
	const immediate = options.immediate ?? true;
	const positionOptions = positionOptionsFrom(options);
	const isSupported = signal(false);
	const active = signal(false);
	const coords = signal<UseGeolocationCoordinates | null>(null);
	const locatedAt = signal<number | null>(null);
	const error = signal<GeolocationPositionError | null>(null);
	let watchId: number | undefined;
	let watchingGeolocation:
		| SupportedGeolocationNavigator["geolocation"]
		| undefined;
	let watchCount = 0;
	let stopped = false;

	const currentNavigator = () => resolveValue(navigatorTarget);
	const syncSupport = (navigator: TNavigator | null | undefined) => {
		isSupported.value = isGeolocationNavigator(navigator);
	};
	const resetState = () => {
		coords.value = null;
		locatedAt.value = null;
		error.value = null;
	};
	const clearCurrentWatch = () => {
		if (watchId === undefined || watchingGeolocation === undefined) {
			return;
		}

		watchingGeolocation.clearWatch(watchId);
		watchId = undefined;
		watchingGeolocation = undefined;
		active.value = false;
		watchCount += 1;
	};
	const updatePosition = (
		position: UseGeolocationPositionLike,
		watchToken: number,
	) => {
		if (stopped || watchToken !== watchCount) {
			return;
		}

		coords.value = cloneCoordinates(position.coords);
		locatedAt.value = position.timestamp;
		error.value = null;
	};
	const updateError = (
		nextError: GeolocationPositionError,
		watchToken: number,
	) => {
		if (stopped || watchToken !== watchCount) {
			return;
		}

		error.value = nextError;
	};
	const pause = () => {
		clearCurrentWatch();
	};
	const resume = () => {
		if (stopped || active.value) {
			return;
		}

		const navigator = currentNavigator();
		syncSupport(navigator);
		if (!isGeolocationNavigator(navigator)) {
			return;
		}

		watchCount += 1;
		const watchToken = watchCount;
		const nextWatchId = navigator.geolocation.watchPosition(
			(position) => {
				updatePosition(position, watchToken);
			},
			(nextError) => {
				updateError(nextError, watchToken);
			},
			positionOptions,
		);
		if (nextWatchId === 0) {
			watchCount += 1;
			return;
		}

		watchId = nextWatchId;
		watchingGeolocation = navigator.geolocation;
		active.value = true;
	};

	const stopWatch = watch(
		() => currentNavigator(),
		(navigator, previousNavigator) => {
			if (stopped) {
				return;
			}

			const wasActive = active.value;
			clearCurrentWatch();
			syncSupport(navigator);
			if (previousNavigator !== undefined && previousNavigator !== navigator) {
				resetState();
			}
			if (wasActive && isSupported.value) {
				resume();
			}
		},
		{ immediate: true, flush: "sync" },
	);
	const stop = () => {
		if (stopped) {
			return;
		}

		stopped = true;
		clearCurrentWatch();
		stopWatch();
	};

	bindAutoStart(resume, pause, immediate);
	tryOnScopeDispose(stop);

	return {
		isSupported: readonly(isSupported),
		isActive: readonly(active),
		coords: readonly(coords),
		locatedAt: readonly(locatedAt),
		error: readonly(error),
		resume,
		pause,
		stop,
	};
}
