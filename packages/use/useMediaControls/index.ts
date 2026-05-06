import { computed, readonly, signal, watch } from "@sigrea/core";
import type { Computed, ReadonlySignal, WatchStopHandle } from "@sigrea/core";

import {
	defaultDocument,
	listen,
	resolveTarget,
	resolveValue,
} from "../../shared";
import { createEventHook } from "../createEventHook";
import { tryOnScopeDispose } from "../tryOnScopeDispose";
import type {
	MaybeTarget,
	UseMediaControlsDocumentLike,
	UseMediaControlsOptions,
	UseMediaControlsReturn,
	UseMediaControlsSource,
	UseMediaControlsTextTrack,
	UseMediaControlsTextTrackSource,
} from "../types";
import { useEventListener } from "../useEventListener";

type MediaTarget = HTMLMediaElement | null | undefined;

const defaultListenerOptions = { passive: true };

function toSourceArray(
	source:
		| string
		| UseMediaControlsSource
		| UseMediaControlsSource[]
		| undefined,
): UseMediaControlsSource[] {
	if (source === undefined || source === "") {
		return [];
	}

	if (typeof source === "string") {
		return [{ src: source }];
	}

	return Array.isArray(source) ? source : [source];
}

function timeRangeToArray(timeRanges: TimeRanges): [number, number][] {
	const ranges: [number, number][] = [];
	for (let i = 0; i < timeRanges.length; i += 1) {
		ranges.push([timeRanges.start(i), timeRanges.end(i)]);
	}
	return ranges;
}

function textTracksToArray(
	textTracks: TextTrackList,
): UseMediaControlsTextTrack[] {
	return Array.from(textTracks as ArrayLike<TextTrack>).map((track, id) => ({
		activeCues: track.activeCues,
		cues: track.cues,
		id,
		inBandMetadataTrackDispatchType: track.inBandMetadataTrackDispatchType,
		kind: track.kind,
		label: track.label,
		language: track.language,
		mode: track.mode,
	}));
}

function setOptionalAttribute(
	element: Element,
	name: string,
	value: string | boolean | undefined,
): void {
	if (value === undefined || value === false) {
		element.removeAttribute(name);
		return;
	}

	element.setAttribute(name, value === true ? "" : value);
}

function setTrackElementProperties(
	track: HTMLTrackElement,
	source: UseMediaControlsTextTrackSource,
): void {
	track.default = source.default ?? false;
	track.kind = source.kind;
	track.label = source.label;
	track.src = source.src;
	track.srclang = source.srcLang;
}

function getTrackId(track: number | UseMediaControlsTextTrack): number {
	return typeof track === "number" ? track : track.id;
}

function isVideoElement(
	element: HTMLMediaElement,
): element is HTMLVideoElement {
	return (
		typeof (element as HTMLVideoElement).requestPictureInPicture === "function"
	);
}

export function useMediaControls<
	TDocument extends UseMediaControlsDocumentLike = UseMediaControlsDocumentLike,
>(
	target: MaybeTarget<MediaTarget>,
	options: UseMediaControlsOptions<TDocument> = {},
): UseMediaControlsReturn {
	const documentTarget =
		"document" in options && options.document !== undefined
			? options.document
			: (defaultDocument as MaybeTarget<TDocument> | undefined);
	const currentElement = () => resolveTarget(target);
	const currentDocument = () =>
		documentTarget === undefined ? undefined : resolveTarget(documentTarget);
	const currentTimeValue = signal(0);
	const duration = signal(0);
	const waiting = signal(false);
	const seeking = signal(false);
	const ended = signal(false);
	const stalled = signal(false);
	const buffered = signal<[number, number][]>([]);
	const playingValue = signal(false);
	const rateValue = signal(1);
	const volumeValue = signal(1);
	const mutedValue = signal(false);
	const tracks = signal<UseMediaControlsTextTrack[]>([]);
	const selectedTrack = signal(-1);
	const isPictureInPicture = signal(false);
	const sourceErrorEvent = createEventHook<Event>();
	const playbackErrorEvent = createEventHook<unknown>();
	const sources = () => toSourceArray(resolveValue(options.src));
	const textTrackSources = () => resolveValue(options.tracks) ?? [];
	let updatingCurrentTimeFromElement = false;
	let updatingPlayingFromElement = false;
	let currentTimeDirty = false;
	let playingDirty = false;
	let rateDirty = false;
	let volumeDirty = false;
	let mutedDirty = false;
	let stopped = false;

	function syncTracksFromElement(element: HTMLMediaElement | undefined): void {
		if (element === undefined) {
			tracks.value = [];
			selectedTrack.value = -1;
			return;
		}

		tracks.value = textTracksToArray(element.textTracks);
	}

	function updateSelectedTrackFromElement(element: HTMLMediaElement): void {
		const trackArray = textTracksToArray(element.textTracks);
		tracks.value = trackArray;
		selectedTrack.value =
			trackArray.find((track) => track.mode === "showing")?.id ?? -1;
	}

	function setPlayingFromElement(value: boolean): void {
		updatingPlayingFromElement = true;
		playingValue.value = value;
		updatingPlayingFromElement = false;
	}

	function setCurrentTimeFromElement(value: number): void {
		updatingCurrentTimeFromElement = true;
		currentTimeValue.value = value;
		updatingCurrentTimeFromElement = false;
	}

	function playElement(element: HTMLMediaElement): void {
		const promise = element.play();
		if (promise !== undefined) {
			promise.catch((error: unknown) => {
				setPlayingFromElement(false);
				void playbackErrorEvent.trigger(error);
			});
		}
	}

	function applyDirtyStateToElement(element: HTMLMediaElement): void {
		if (volumeDirty) {
			element.volume = volumeValue.value;
		}
		if (mutedDirty) {
			element.muted = mutedValue.value;
		}
		if (rateDirty) {
			element.playbackRate = rateValue.value;
		}
		if (currentTimeDirty && element.currentTime !== currentTimeValue.value) {
			element.currentTime = currentTimeValue.value;
		}
		if (playingDirty) {
			if (playingValue.value) {
				playElement(element);
			} else {
				element.pause();
			}
		}
	}

	function syncStateFromElement(element: HTMLMediaElement): void {
		duration.value = element.duration;
		buffered.value = timeRangeToArray(element.buffered);
		if (!currentTimeDirty) {
			setCurrentTimeFromElement(element.currentTime);
		}
		if (!playingDirty) {
			setPlayingFromElement(!element.paused);
		}
		if (!rateDirty) {
			rateValue.value = element.playbackRate;
		}
		if (!volumeDirty) {
			volumeValue.value = element.volume;
		}
		if (!mutedDirty) {
			mutedValue.value = element.muted;
		}
		updateSelectedTrackFromElement(element);
	}

	function enableTrack(
		track: number | UseMediaControlsTextTrack,
		disableTracks = true,
	): void {
		const element = currentElement();
		if (element === undefined) {
			return;
		}

		const id = getTrackId(track);
		if (disableTracks) {
			disableTrack();
		}

		const textTrack = element.textTracks[id];
		if (textTrack === undefined) {
			return;
		}

		textTrack.mode = "showing";
		updateSelectedTrackFromElement(element);
	}

	function disableTrack(track?: number | UseMediaControlsTextTrack): void {
		const element = currentElement();
		if (element === undefined) {
			return;
		}

		if (track !== undefined) {
			const textTrack = element.textTracks[getTrackId(track)];
			if (textTrack !== undefined) {
				textTrack.mode = "disabled";
			}
		} else {
			for (let i = 0; i < element.textTracks.length; i += 1) {
				element.textTracks[i].mode = "disabled";
			}
		}

		updateSelectedTrackFromElement(element);
	}

	function togglePictureInPicture(): Promise<PictureInPictureWindow | void> {
		const element = currentElement();
		const document = currentDocument();
		if (
			element === undefined ||
			document === undefined ||
			document.pictureInPictureEnabled !== true ||
			!isVideoElement(element)
		) {
			return Promise.resolve();
		}

		if (!isPictureInPicture.value) {
			return element.requestPictureInPicture();
		}

		return document.exitPictureInPicture?.() ?? Promise.resolve();
	}

	const supportsPictureInPicture = computed(
		() => currentDocument()?.pictureInPictureEnabled === true,
	);

	const currentTime = computed<number>({
		get: () => currentTimeValue.value,
		set(value) {
			currentTimeValue.value = value;
			if (updatingCurrentTimeFromElement) {
				return;
			}

			currentTimeDirty = true;
			const element = currentElement();
			if (element !== undefined) {
				element.currentTime = value;
			}
		},
	});
	const playing = computed<boolean>({
		get: () => playingValue.value,
		set(value) {
			playingValue.value = value;
			if (updatingPlayingFromElement) {
				return;
			}

			playingDirty = true;
			const element = currentElement();
			if (element === undefined) {
				return;
			}

			if (value) {
				playElement(element);
			} else {
				element.pause();
			}
		},
	});
	const rate = computed<number>({
		get: () => rateValue.value,
		set(value) {
			rateValue.value = value;
			rateDirty = true;
			const element = currentElement();
			if (element !== undefined) {
				element.playbackRate = value;
			}
		},
	});
	const volume = computed<number>({
		get: () => volumeValue.value,
		set(value) {
			volumeValue.value = value;
			volumeDirty = true;
			const element = currentElement();
			if (element !== undefined) {
				element.volume = value;
			}
		},
	});
	const muted = computed<boolean>({
		get: () => mutedValue.value,
		set(value) {
			mutedValue.value = value;
			mutedDirty = true;
			const element = currentElement();
			if (element !== undefined) {
				element.muted = value;
			}
		},
	});

	const stopTargetWatch = watch(
		() => currentElement(),
		(element) => {
			if (element === undefined) {
				syncTracksFromElement(undefined);
				return;
			}

			applyDirtyStateToElement(element);
			syncStateFromElement(element);
		},
		{ immediate: true, flush: "sync" },
	);

	const stopSourcesWatch = watch(
		() => ({
			document: currentDocument(),
			element: currentElement(),
			sources: sources(),
		}),
		({ document, element, sources }, _previous, onCleanup) => {
			if (
				document === undefined ||
				element === undefined ||
				sources.length === 0
			) {
				return;
			}

			const cleanups: Array<() => void> = [];
			for (const source of Array.from(element.querySelectorAll("source"))) {
				source.remove();
			}
			for (const source of sources) {
				const sourceElement = document.createElement("source");
				sourceElement.setAttribute("src", source.src);
				setOptionalAttribute(sourceElement, "type", source.type);
				setOptionalAttribute(sourceElement, "media", source.media);
				cleanups.push(listen(sourceElement, "error", sourceErrorEvent.trigger));
				element.appendChild(sourceElement);
			}
			element.load();
			onCleanup(() => {
				for (const cleanup of cleanups) {
					cleanup();
				}
			});
		},
		{ immediate: true, flush: "sync" },
	);

	const stopTracksWatch = watch(
		() => ({
			document: currentDocument(),
			element: currentElement(),
			tracks: textTrackSources(),
		}),
		({ document, element, tracks }) => {
			if (
				document === undefined ||
				element === undefined ||
				tracks.length === 0
			) {
				return;
			}

			for (const track of Array.from(element.querySelectorAll("track"))) {
				track.remove();
			}
			for (const [index, source] of tracks.entries()) {
				const track = document.createElement("track");
				setTrackElementProperties(track, source);
				element.appendChild(track);
				if (track.default) {
					selectedTrack.value = index;
				}
			}
			updateSelectedTrackFromElement(element);
		},
		{ immediate: true, flush: "sync" },
	);

	const timeupdate = useEventListener(
		target,
		"timeupdate",
		() => {
			const element = currentElement();
			if (element !== undefined) {
				setCurrentTimeFromElement(element.currentTime);
			}
		},
		defaultListenerOptions,
	);
	const durationchange = useEventListener(
		target,
		"durationchange",
		() => {
			const element = currentElement();
			if (element !== undefined) {
				duration.value = element.duration;
			}
		},
		defaultListenerOptions,
	);
	const progress = useEventListener(
		target,
		"progress",
		() => {
			const element = currentElement();
			if (element !== undefined) {
				buffered.value = timeRangeToArray(element.buffered);
			}
		},
		defaultListenerOptions,
	);
	const seekingListener = useEventListener(
		target,
		"seeking",
		() => {
			seeking.value = true;
		},
		defaultListenerOptions,
	);
	const seeked = useEventListener(
		target,
		"seeked",
		() => {
			seeking.value = false;
		},
		defaultListenerOptions,
	);
	const waitingListener = useEventListener(
		target,
		["waiting", "loadstart"],
		() => {
			waiting.value = true;
			setPlayingFromElement(false);
		},
		defaultListenerOptions,
	);
	const loadeddata = useEventListener(
		target,
		"loadeddata",
		() => {
			waiting.value = false;
		},
		defaultListenerOptions,
	);
	const playingListener = useEventListener(
		target,
		"playing",
		() => {
			waiting.value = false;
			ended.value = false;
			setPlayingFromElement(true);
		},
		defaultListenerOptions,
	);
	const ratechange = useEventListener(
		target,
		"ratechange",
		() => {
			const element = currentElement();
			if (element !== undefined) {
				rateValue.value = element.playbackRate;
			}
		},
		defaultListenerOptions,
	);
	const stalledListener = useEventListener(
		target,
		"stalled",
		() => {
			stalled.value = true;
		},
		defaultListenerOptions,
	);
	const endedListener = useEventListener(
		target,
		"ended",
		() => {
			ended.value = true;
		},
		defaultListenerOptions,
	);
	const pause = useEventListener(
		target,
		"pause",
		() => {
			setPlayingFromElement(false);
		},
		defaultListenerOptions,
	);
	const play = useEventListener(
		target,
		"play",
		() => {
			setPlayingFromElement(true);
		},
		defaultListenerOptions,
	);
	const enterPictureInPicture = useEventListener(
		target,
		"enterpictureinpicture",
		() => {
			isPictureInPicture.value = true;
		},
		defaultListenerOptions,
	);
	const leavePictureInPicture = useEventListener(
		target,
		"leavepictureinpicture",
		() => {
			isPictureInPicture.value = false;
		},
		defaultListenerOptions,
	);
	const volumechange = useEventListener(
		target,
		"volumechange",
		() => {
			const element = currentElement();
			if (element === undefined) {
				return;
			}

			volumeValue.value = element.volume;
			mutedValue.value = element.muted;
		},
		defaultListenerOptions,
	);
	const textTrackChanges = useEventListener(
		() => currentElement()?.textTracks,
		["addtrack", "removetrack", "change"],
		() => {
			const element = currentElement();
			if (element !== undefined) {
				updateSelectedTrackFromElement(element);
			}
		},
		defaultListenerOptions,
	);

	const subscriptions = [
		timeupdate,
		durationchange,
		progress,
		seekingListener,
		seeked,
		waitingListener,
		loadeddata,
		playingListener,
		ratechange,
		stalledListener,
		endedListener,
		pause,
		play,
		enterPictureInPicture,
		leavePictureInPicture,
		volumechange,
		textTrackChanges,
	];

	function stop(): void {
		if (stopped) {
			return;
		}

		stopped = true;
		stopTargetWatch();
		stopSourcesWatch();
		stopTracksWatch();
		for (const subscription of subscriptions) {
			subscription.stop();
		}
	}

	tryOnScopeDispose(stop);

	return {
		currentTime,
		duration: readonly(duration),
		waiting: readonly(waiting),
		seeking: readonly(seeking),
		ended: readonly(ended),
		stalled: readonly(stalled),
		buffered: readonly(buffered),
		playing,
		rate,
		volume,
		muted,
		tracks: readonly(tracks),
		selectedTrack: readonly(selectedTrack),
		enableTrack,
		disableTrack,
		supportsPictureInPicture: readonly(supportsPictureInPicture),
		togglePictureInPicture,
		isPictureInPicture: readonly(isPictureInPicture),
		onSourceError: sourceErrorEvent.on,
		onPlaybackError: playbackErrorEvent.on,
		stop,
	};
}
