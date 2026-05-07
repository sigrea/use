import { computed, readonly, signal, watch } from "@sigrea/core";

import { defaultNavigator, listen, resolveValue } from "../../shared";
import { tryOnScopeDispose } from "../tryOnScopeDispose";
import type {
	MaybeValue,
	UseUserMediaMediaDevicesLike,
	UseUserMediaMediaStreamLike,
	UseUserMediaNavigatorLike,
	UseUserMediaOptions,
	UseUserMediaReturn,
} from "../types";

type SupportedUserMediaNavigator<TStream extends UseUserMediaMediaStreamLike> =
	UseUserMediaNavigatorLike<TStream> & {
		readonly mediaDevices: UseUserMediaMediaDevicesLike<TStream>;
	};

function isUserMediaNavigator<TStream extends UseUserMediaMediaStreamLike>(
	navigator: UseUserMediaNavigatorLike<TStream> | null | undefined,
): navigator is SupportedUserMediaNavigator<TStream> {
	return typeof navigator?.mediaDevices?.getUserMedia === "function";
}

function stopStream(stream: UseUserMediaMediaStreamLike | undefined): void {
	for (const track of stream?.getTracks() ?? []) {
		track.stop();
	}
}

function createDefaultConstraints(): MediaStreamConstraints {
	return {
		audio: true,
		video: true,
	};
}

/**
 * Reactive MediaDevices.getUserMedia() controls.
 */
export function useUserMedia<
	TStream extends UseUserMediaMediaStreamLike = MediaStream,
	TNavigator extends
		UseUserMediaNavigatorLike<TStream> = UseUserMediaNavigatorLike<TStream>,
>(
	options: UseUserMediaOptions<TStream, TNavigator> = {},
): UseUserMediaReturn<TStream> {
	const navigatorTarget: MaybeValue<TNavigator | null | undefined> =
		"navigator" in options
			? options.navigator
			: (defaultNavigator as TNavigator | undefined);
	const enabled = signal(resolveValue(options.enabled ?? false));
	const autoSwitch = signal(resolveValue(options.autoSwitch ?? true));
	const constraints = signal<MediaStreamConstraints>(
		resolveValue(options.constraints) ?? createDefaultConstraints(),
	);
	const stream = signal<TStream | undefined>(undefined);
	const isSupported = signal(false);
	const isStarting = signal(false);
	const isStreaming = computed(() => stream.value !== undefined);
	const error = signal<unknown | null>(null);
	let executionCount = 0;
	let pendingStart: Promise<TStream | undefined> | undefined;
	let trackListeners: Array<() => void> = [];

	const currentNavigator = () => resolveValue(navigatorTarget);
	const syncSupport = (navigator: TNavigator | null | undefined) => {
		isSupported.value = isUserMediaNavigator(navigator);
	};
	const getDeviceOptions = (
		type: "audio" | "video",
	): boolean | MediaTrackConstraints | undefined => {
		const currentConstraints = constraints.value ?? createDefaultConstraints();

		return currentConstraints[type] || false;
	};
	const clearTrackListeners = () => {
		for (const stopListening of trackListeners) {
			stopListening();
		}
		trackListeners = [];
	};
	const clearStream = (shouldStopTracks: boolean) => {
		const currentStream = stream.value;
		clearTrackListeners();
		stream.value = undefined;
		if (shouldStopTracks) {
			stopStream(currentStream);
		}
	};
	const cancelPendingStart = () => {
		executionCount += 1;
		pendingStart = undefined;
		isStarting.value = false;
	};
	const setStream = (nextStream: TStream) => {
		clearStream(true);
		stream.value = nextStream;
		error.value = null;

		const handleEnded = () => {
			if (stream.value !== nextStream) {
				return;
			}

			cancelPendingStart();
			clearStream(true);
			enabled.value = false;
		};

		for (const track of nextStream.getTracks()) {
			trackListeners.push(
				listen(track, "ended", handleEnded, { passive: true }),
			);
		}
	};
	const stopCapture = () => {
		cancelPendingStart();
		clearStream(true);
	};

	const startCapture = async (): Promise<TStream | undefined> => {
		if (stream.value !== undefined) {
			return stream.value;
		}
		if (pendingStart !== undefined) {
			return pendingStart;
		}

		executionCount += 1;
		const executionId = executionCount;
		const navigator = currentNavigator();
		syncSupport(navigator);
		isStarting.value = true;
		error.value = null;

		pendingStart = (async () => {
			if (!isUserMediaNavigator(navigator)) {
				return undefined;
			}

			let nextStream: TStream;
			try {
				nextStream = await navigator.mediaDevices.getUserMedia({
					audio: getDeviceOptions("audio"),
					video: getDeviceOptions("video"),
				});
			} catch (caughtError) {
				if (executionId === executionCount) {
					error.value = caughtError;
				}
				return undefined;
			}

			if (executionId !== executionCount || currentNavigator() !== navigator) {
				stopStream(nextStream);
				return undefined;
			}

			setStream(nextStream);
			return nextStream;
		})();

		try {
			return await pendingStart;
		} finally {
			if (executionId === executionCount) {
				isStarting.value = false;
				pendingStart = undefined;
			}
		}
	};
	const start = async (): Promise<TStream | undefined> => {
		const nextStream = await startCapture();
		if (nextStream !== undefined) {
			enabled.value = true;
		}

		return nextStream;
	};
	const stop = () => {
		stopCapture();
		enabled.value = false;
	};
	const restart = async (): Promise<TStream | undefined> => {
		stopCapture();
		return start();
	};

	const stopEnabledSourceWatch =
		"enabled" in options
			? watch(
					() => resolveValue(options.enabled ?? false),
					(value) => {
						enabled.value = value;
					},
					{ flush: "sync" },
				)
			: undefined;
	const stopAutoSwitchSourceWatch =
		"autoSwitch" in options
			? watch(
					() => resolveValue(options.autoSwitch ?? true),
					(value) => {
						autoSwitch.value = value;
					},
					{ flush: "sync" },
				)
			: undefined;
	const stopConstraintsSourceWatch =
		"constraints" in options
			? watch(
					() => resolveValue(options.constraints),
					(value) => {
						constraints.value = value ?? createDefaultConstraints();
					},
					{ deep: true, flush: "sync" },
				)
			: undefined;
	const stopStreamWatch = watch(
		() => ({
			enabled: enabled.value,
			navigator: currentNavigator(),
		}),
		({ enabled: shouldStream, navigator }, previous) => {
			syncSupport(navigator);

			if (!shouldStream || !isUserMediaNavigator(navigator)) {
				stopCapture();
				return;
			}

			if (previous !== undefined && previous.navigator !== navigator) {
				stopCapture();
			}

			if (stream.value === undefined) {
				void startCapture();
			}
		},
		{ immediate: true, flush: "sync" },
	);
	const stopConstraintsWatch = watch(
		() => constraints.value,
		() => {
			if (
				autoSwitch.value &&
				(stream.value !== undefined || pendingStart !== undefined)
			) {
				void restart();
			}
		},
		{ deep: true, flush: "sync", immediate: false },
	);

	tryOnScopeDispose(() => {
		stopEnabledSourceWatch?.();
		stopAutoSwitchSourceWatch?.();
		stopConstraintsSourceWatch?.();
		stopStreamWatch();
		stopConstraintsWatch();
		stop();
	});

	return {
		stream: readonly(stream),
		isSupported: readonly(isSupported),
		isStarting: readonly(isStarting),
		isStreaming: readonly(isStreaming),
		error: readonly(error),
		enabled,
		autoSwitch,
		constraints,
		start,
		stop,
		restart,
	};
}
