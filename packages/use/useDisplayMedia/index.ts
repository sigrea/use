import { computed, readonly, signal, watch } from "@sigrea/core";

import { defaultNavigator, listen, resolveValue } from "../../shared";
import { tryOnScopeDispose } from "../tryOnScopeDispose";
import type {
	MaybeValue,
	UseDisplayMediaMediaDevicesLike,
	UseDisplayMediaMediaStreamLike,
	UseDisplayMediaNavigatorLike,
	UseDisplayMediaOptions,
	UseDisplayMediaReturn,
} from "../types";

const defaultConstraints: DisplayMediaStreamOptions = {
	video: true,
};

type SupportedDisplayMediaNavigator<
	TStream extends UseDisplayMediaMediaStreamLike,
> = UseDisplayMediaNavigatorLike<TStream> & {
	readonly mediaDevices: UseDisplayMediaMediaDevicesLike<TStream>;
};

function isDisplayMediaNavigator<
	TStream extends UseDisplayMediaMediaStreamLike,
>(
	navigator: UseDisplayMediaNavigatorLike<TStream> | null | undefined,
): navigator is SupportedDisplayMediaNavigator<TStream> {
	return typeof navigator?.mediaDevices?.getDisplayMedia === "function";
}

function stopStream(stream: UseDisplayMediaMediaStreamLike | undefined): void {
	for (const track of stream?.getTracks() ?? []) {
		track.stop();
	}
}

/**
 * Reactive MediaDevices.getDisplayMedia() controls.
 */
export function useDisplayMedia<
	TStream extends UseDisplayMediaMediaStreamLike = MediaStream,
	TNavigator extends
		UseDisplayMediaNavigatorLike<TStream> = UseDisplayMediaNavigatorLike<TStream>,
>(
	options: UseDisplayMediaOptions<TStream, TNavigator> = {},
): UseDisplayMediaReturn<TStream> {
	const navigatorTarget: MaybeValue<TNavigator | null | undefined> =
		"navigator" in options
			? options.navigator
			: (defaultNavigator as TNavigator | undefined);
	const enabled: MaybeValue<boolean> = options.enabled ?? false;
	const constraints: MaybeValue<DisplayMediaStreamOptions> =
		options.constraints ?? defaultConstraints;
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
		isSupported.value = isDisplayMediaNavigator(navigator);
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
	const setStream = (nextStream: TStream) => {
		clearStream(true);
		stream.value = nextStream;
		error.value = null;

		const handleEnded = () => {
			if (stream.value !== nextStream) {
				return;
			}

			executionCount += 1;
			clearStream(true);
		};

		for (const track of nextStream.getTracks()) {
			trackListeners.push(
				listen(track, "ended", handleEnded, { passive: true }),
			);
		}
	};

	const start = async (): Promise<TStream | undefined> => {
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
			if (!isDisplayMediaNavigator(navigator)) {
				return undefined;
			}

			let nextStream: TStream;
			try {
				nextStream = await navigator.mediaDevices.getDisplayMedia(
					resolveValue(constraints),
				);
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
	const stop = () => {
		executionCount += 1;
		pendingStart = undefined;
		isStarting.value = false;
		clearStream(true);
	};
	const stopWatch = watch(
		() => ({
			enabled: resolveValue(enabled),
			navigator: currentNavigator(),
		}),
		({ enabled: shouldStream, navigator }) => {
			executionCount += 1;
			pendingStart = undefined;
			isStarting.value = false;
			syncSupport(navigator);
			clearStream(true);

			if (!shouldStream || !isDisplayMediaNavigator(navigator)) {
				return;
			}

			void start();
		},
		{ immediate: true, flush: "sync" },
	);

	tryOnScopeDispose(() => {
		stopWatch();
		stop();
	});

	return {
		stream: readonly(stream),
		isSupported: readonly(isSupported),
		isStarting: readonly(isStarting),
		isStreaming: readonly(isStreaming),
		error: readonly(error),
		start,
		stop,
	};
}
