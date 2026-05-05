import { computed, readonly, signal, watch } from "@sigrea/core";

import { defaultNavigator, listen, resolveValue } from "../../shared";
import type {
	MaybeValue,
	UseDevicesListMediaDevicesLike,
	UseDevicesListMediaStreamLike,
	UseDevicesListNavigatorLike,
	UseDevicesListOptions,
	UseDevicesListPermissionName,
	UseDevicesListReturn,
} from "../types";

const defaultConstraints: MediaStreamConstraints = {
	audio: true,
	video: true,
};

type SupportedDevicesNavigator = UseDevicesListNavigatorLike & {
	readonly mediaDevices: UseDevicesListMediaDevicesLike;
};

function isMediaDevicesNavigator(
	navigator: UseDevicesListNavigatorLike | null | undefined,
): navigator is SupportedDevicesNavigator {
	return (
		typeof navigator?.mediaDevices?.enumerateDevices === "function" &&
		typeof navigator.mediaDevices.addEventListener === "function" &&
		typeof navigator.mediaDevices.removeEventListener === "function"
	);
}

function stopStream(stream: UseDevicesListMediaStreamLike | undefined): void {
	for (const track of stream?.getTracks() ?? []) {
		track.stop();
	}
}

function hasRequestedAudio(constraints: MediaStreamConstraints): boolean {
	return constraints.audio !== undefined && constraints.audio !== false;
}

function hasRequestedVideo(constraints: MediaStreamConstraints): boolean {
	return constraints.video !== undefined && constraints.video !== false;
}

function requestedPermissionNames(
	constraints: MediaStreamConstraints,
): UseDevicesListPermissionName[] {
	const names: UseDevicesListPermissionName[] = [];
	if (hasRequestedAudio(constraints)) {
		names.push("microphone");
	}
	if (hasRequestedVideo(constraints)) {
		names.push("camera");
	}

	return names;
}

function getConstraintsForAvailableInputs(
	constraints: MediaStreamConstraints,
	devices: readonly MediaDeviceInfo[],
): MediaStreamConstraints {
	const hasAudioInput = devices.some((device) => device.kind === "audioinput");
	const hasVideoInput = devices.some((device) => device.kind === "videoinput");

	return {
		...constraints,
		audio:
			hasRequestedAudio(constraints) && hasAudioInput
				? constraints.audio
				: false,
		video:
			hasRequestedVideo(constraints) && hasVideoInput
				? constraints.video
				: false,
	};
}

async function queryPermissionState(
	navigator: UseDevicesListNavigatorLike,
	name: UseDevicesListPermissionName,
): Promise<PermissionState | undefined> {
	try {
		return (await navigator.permissions?.query({ name }))?.state;
	} catch {
		return undefined;
	}
}

/**
 * Reactive MediaDevices.enumerateDevices() list.
 */
export function useDevicesList<
	TNavigator extends UseDevicesListNavigatorLike = UseDevicesListNavigatorLike,
>(options: UseDevicesListOptions<TNavigator> = {}): UseDevicesListReturn {
	const navigatorTarget: MaybeValue<TNavigator | null | undefined> | undefined =
		"navigator" in options
			? options.navigator
			: (defaultNavigator as TNavigator | undefined);
	const requestPermissions: MaybeValue<boolean> =
		options.requestPermissions ?? false;
	const constraints: MaybeValue<MediaStreamConstraints> =
		options.constraints ?? defaultConstraints;
	const devices = signal<MediaDeviceInfo[]>([]);
	const isSupported = signal(false);
	const permissionGranted = signal(false);
	const videoInputs = computed(() =>
		devices.value.filter((device) => device.kind === "videoinput"),
	);
	const audioInputs = computed(() =>
		devices.value.filter((device) => device.kind === "audioinput"),
	);
	const audioOutputs = computed(() =>
		devices.value.filter((device) => device.kind === "audiooutput"),
	);
	const activePermissionStreams = new Set<UseDevicesListMediaStreamLike>();
	let executionCount = 0;
	let stopped = false;

	const stopPermissionStream = (
		stream: UseDevicesListMediaStreamLike | undefined,
	): void => {
		if (stream === undefined || !activePermissionStreams.delete(stream)) {
			return;
		}

		stopStream(stream);
	};
	const stopActivePermissionStreams = (): void => {
		const streams = [...activePermissionStreams];
		activePermissionStreams.clear();
		for (const stream of streams) {
			stopStream(stream);
		}
	};
	const currentNavigator = () => resolveValue(navigatorTarget);
	const syncSupport = (navigator: TNavigator | null | undefined) => {
		isSupported.value = isMediaDevicesNavigator(navigator);
	};
	const readDevices = async (
		navigator: SupportedDevicesNavigator,
		executionId: number,
	): Promise<MediaDeviceInfo[] | undefined> => {
		try {
			const nextDevices = await navigator.mediaDevices.enumerateDevices();
			if (stopped || executionId !== executionCount) {
				return undefined;
			}

			devices.value = [...nextDevices];
			options.onUpdated?.(devices.value);
			return devices.value;
		} catch {
			return undefined;
		}
	};
	const update = async (): Promise<void> => {
		if (stopped) {
			return;
		}

		executionCount += 1;
		const executionId = executionCount;
		const navigator = currentNavigator();
		syncSupport(navigator);
		if (!isMediaDevicesNavigator(navigator)) {
			return;
		}

		await readDevices(navigator, executionId);
	};
	const ensurePermissions = async (): Promise<boolean> => {
		if (stopped) {
			return false;
		}

		executionCount += 1;
		const executionId = executionCount;
		const navigator = currentNavigator();
		const requestedConstraints = resolveValue(constraints);
		const permissionNames = requestedPermissionNames(requestedConstraints);
		syncSupport(navigator);
		if (!isMediaDevicesNavigator(navigator)) {
			permissionGranted.value = false;
			return false;
		}

		if (permissionNames.length === 0) {
			await readDevices(navigator, executionId);
			if (stopped || executionId !== executionCount) {
				return false;
			}

			permissionGranted.value = true;
			return true;
		}

		const permissionStates = await Promise.all(
			permissionNames.map((name) => queryPermissionState(navigator, name)),
		);
		if (stopped || executionId !== executionCount) {
			return false;
		}

		if (permissionStates.every((state) => state === "granted")) {
			await readDevices(navigator, executionId);
			if (stopped || executionId !== executionCount) {
				return false;
			}

			permissionGranted.value = true;
			return true;
		}
		if (permissionStates.some((state) => state === "denied")) {
			permissionGranted.value = false;
			await readDevices(navigator, executionId);
			return false;
		}

		if (typeof navigator.mediaDevices.getUserMedia !== "function") {
			permissionGranted.value = false;
			await readDevices(navigator, executionId);
			return false;
		}

		const availableDevices =
			(await readDevices(navigator, executionId)) ?? devices.value;
		if (stopped || executionId !== executionCount) {
			return false;
		}

		const availableConstraints = getConstraintsForAvailableInputs(
			requestedConstraints,
			availableDevices,
		);
		if (
			!hasRequestedAudio(availableConstraints) &&
			!hasRequestedVideo(availableConstraints)
		) {
			permissionGranted.value = false;
			return false;
		}

		let stream: UseDevicesListMediaStreamLike | undefined;
		try {
			stream = await navigator.mediaDevices.getUserMedia(availableConstraints);
			activePermissionStreams.add(stream);
		} catch {
			if (executionId === executionCount) {
				permissionGranted.value = false;
				await readDevices(navigator, executionId);
			}
			return false;
		}

		try {
			if (stopped || executionId !== executionCount) {
				return false;
			}

			await readDevices(navigator, executionId);
			if (stopped || executionId !== executionCount) {
				return false;
			}

			permissionGranted.value = true;
			return true;
		} finally {
			stopPermissionStream(stream);
		}
	};

	const stopWatch = watch(
		() => {
			return {
				constraints: resolveValue(constraints),
				navigator: currentNavigator(),
				requestPermissions: resolveValue(requestPermissions),
			};
		},
		({ navigator, requestPermissions }, _previousValue, onCleanup) => {
			if (stopped) {
				return;
			}

			executionCount += 1;
			const executionId = executionCount;
			devices.value = [];
			permissionGranted.value = false;
			syncSupport(navigator);
			if (!isMediaDevicesNavigator(navigator)) {
				return;
			}

			const stopDeviceChange = listen(
				navigator.mediaDevices,
				"devicechange",
				() => {
					void update();
				},
				{ passive: true },
			);
			onCleanup(() => {
				stopDeviceChange();
				stopActivePermissionStreams();
			});

			if (requestPermissions) {
				void ensurePermissions();
				return;
			}

			void readDevices(navigator, executionId);
		},
		{ immediate: true, flush: "sync" },
	);
	const stop = () => {
		if (stopped) {
			return;
		}

		stopped = true;
		executionCount += 1;
		stopActivePermissionStreams();
		stopWatch();
	};

	return {
		devices: readonly(devices),
		videoInputs: readonly(videoInputs),
		audioInputs: readonly(audioInputs),
		audioOutputs: readonly(audioOutputs),
		isSupported: readonly(isSupported),
		permissionGranted: readonly(permissionGranted),
		ensurePermissions,
		stop,
	};
}
