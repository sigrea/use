import { signal } from "@sigrea/core";
import { describe, expect, it, vi } from "vitest";

import { useMediaControls } from "./index";

class FakeTextTrackList extends EventTarget {
	[index: number]: TextTrack;

	private tracks: TextTrack[] = [];

	get length(): number {
		return this.tracks.length;
	}

	item(index: number): TextTrack | null {
		return this.tracks[index] ?? null;
	}

	getTrackById(id: string): TextTrack | null {
		return this.tracks.find((track) => track.id === id) ?? null;
	}

	setTracks(tracks: TextTrack[]): void {
		for (let i = 0; i < this.tracks.length; i += 1) {
			delete this[i];
		}
		this.tracks = tracks;
		for (const [index, track] of tracks.entries()) {
			Object.defineProperty(this, index, {
				configurable: true,
				value: track,
			});
		}
	}
}

interface MediaFixture {
	element: HTMLVideoElement;
	textTracks: FakeTextTrackList;
	play: ReturnType<typeof vi.fn>;
	pause: ReturnType<typeof vi.fn>;
	load: ReturnType<typeof vi.fn>;
	setDuration(value: number): void;
	setBuffered(ranges: [number, number][]): void;
	setPaused(value: boolean): void;
}

function createTimeRanges(ranges: [number, number][]): TimeRanges {
	return {
		length: ranges.length,
		start(index: number) {
			const range = ranges[index];
			if (range === undefined) {
				throw new DOMException("IndexSizeError");
			}
			return range[0];
		},
		end(index: number) {
			const range = ranges[index];
			if (range === undefined) {
				throw new DOMException("IndexSizeError");
			}
			return range[1];
		},
	};
}

function createTextTrack(
	id: string,
	mode: TextTrackMode = "disabled",
): TextTrack {
	return {
		activeCues: null,
		cues: null,
		id,
		inBandMetadataTrackDispatchType: "",
		kind: "subtitles",
		label: id,
		language: "en",
		mode,
	} as TextTrack;
}

function createMediaFixture(): MediaFixture {
	const element = document.createElement("video");
	const textTracks = new FakeTextTrackList();
	let currentTime = 0;
	let duration = 0;
	let volume = 1;
	let muted = false;
	let playbackRate = 1;
	let paused = true;
	let buffered = createTimeRanges([]);
	const play = vi.fn(() => {
		paused = false;
		element.dispatchEvent(new Event("play"));
		return Promise.resolve();
	});
	const pause = vi.fn(() => {
		paused = true;
		element.dispatchEvent(new Event("pause"));
	});
	const load = vi.fn();

	Object.defineProperties(element, {
		buffered: {
			configurable: true,
			get: () => buffered,
		},
		currentTime: {
			configurable: true,
			get: () => currentTime,
			set: (value: number) => {
				currentTime = value;
			},
		},
		duration: {
			configurable: true,
			get: () => duration,
		},
		muted: {
			configurable: true,
			get: () => muted,
			set: (value: boolean) => {
				muted = value;
			},
		},
		paused: {
			configurable: true,
			get: () => paused,
		},
		play: {
			configurable: true,
			value: play,
		},
		playbackRate: {
			configurable: true,
			get: () => playbackRate,
			set: (value: number) => {
				playbackRate = value;
			},
		},
		pause: {
			configurable: true,
			value: pause,
		},
		load: {
			configurable: true,
			value: load,
		},
		textTracks: {
			configurable: true,
			get: () => textTracks,
		},
		volume: {
			configurable: true,
			get: () => volume,
			set: (value: number) => {
				volume = value;
			},
		},
	});

	return {
		element,
		textTracks,
		play,
		pause,
		load,
		setDuration(value) {
			duration = value;
		},
		setBuffered(ranges) {
			buffered = createTimeRanges(ranges);
		},
		setPaused(value) {
			paused = value;
		},
	};
}

describe("useMediaControls", () => {
	it("controls media playback, time, volume, rate, and muted state", async () => {
		const fixture = createMediaFixture();
		fixture.setDuration(120);
		const controls = useMediaControls(fixture.element);

		expect(controls.duration.value).toBe(120);

		controls.currentTime.value = 30;
		controls.volume.value = 0.5;
		controls.rate.value = 1.25;
		controls.muted.value = true;
		controls.playing.value = true;

		expect(fixture.element.currentTime).toBe(30);
		expect(fixture.element.volume).toBe(0.5);
		expect(fixture.element.playbackRate).toBe(1.25);
		expect(fixture.element.muted).toBe(true);
		expect(fixture.play).toHaveBeenCalledOnce();

		await Promise.resolve();

		controls.playing.value = false;

		expect(fixture.pause).toHaveBeenCalledOnce();
	});

	it("syncs existing media state without overwriting it on initial bind", () => {
		const fixture = createMediaFixture();
		fixture.setDuration(Number.POSITIVE_INFINITY);
		fixture.setPaused(false);
		fixture.element.currentTime = 42;
		fixture.element.volume = 0.4;
		fixture.element.playbackRate = 1.75;
		fixture.element.muted = true;

		const controls = useMediaControls(fixture.element);

		expect(controls.currentTime.value).toBe(42);
		expect(controls.duration.value).toBe(Number.POSITIVE_INFINITY);
		expect(controls.playing.value).toBe(true);
		expect(controls.volume.value).toBe(0.4);
		expect(controls.rate.value).toBe(1.75);
		expect(controls.muted.value).toBe(true);
		expect(fixture.element.currentTime).toBe(42);
		expect(fixture.element.volume).toBe(0.4);
		expect(fixture.element.playbackRate).toBe(1.75);
		expect(fixture.element.muted).toBe(true);
		expect(fixture.play).not.toHaveBeenCalled();
		expect(fixture.pause).not.toHaveBeenCalled();
	});

	it("updates readonly state from media events", () => {
		const fixture = createMediaFixture();
		const controls = useMediaControls(fixture.element);

		fixture.element.currentTime = 15;
		fixture.element.dispatchEvent(new Event("timeupdate"));
		expect(controls.currentTime.value).toBe(15);

		fixture.setDuration(90);
		fixture.element.dispatchEvent(new Event("durationchange"));
		expect(controls.duration.value).toBe(90);
		fixture.setDuration(Number.NaN);
		fixture.element.dispatchEvent(new Event("durationchange"));
		expect(Number.isNaN(controls.duration.value)).toBe(true);
		fixture.setDuration(Number.POSITIVE_INFINITY);
		fixture.element.dispatchEvent(new Event("durationchange"));
		expect(controls.duration.value).toBe(Number.POSITIVE_INFINITY);

		fixture.setBuffered([
			[0, 10],
			[20, 30],
		]);
		fixture.element.dispatchEvent(new Event("progress"));
		expect(controls.buffered.value).toEqual([
			[0, 10],
			[20, 30],
		]);

		fixture.element.dispatchEvent(new Event("seeking"));
		expect(controls.seeking.value).toBe(true);
		fixture.element.dispatchEvent(new Event("seeked"));
		expect(controls.seeking.value).toBe(false);

		fixture.element.dispatchEvent(new Event("waiting"));
		expect(controls.waiting.value).toBe(true);
		expect(controls.playing.value).toBe(false);
		fixture.element.dispatchEvent(new Event("loadeddata"));
		expect(controls.waiting.value).toBe(false);

		fixture.element.dispatchEvent(new Event("playing"));
		expect(controls.playing.value).toBe(true);
		expect(controls.ended.value).toBe(false);
		fixture.element.dispatchEvent(new Event("stalled"));
		expect(controls.stalled.value).toBe(true);
		fixture.element.dispatchEvent(new Event("ended"));
		expect(controls.ended.value).toBe(true);
	});

	it("injects sources and reports source errors", () => {
		const fixture = createMediaFixture();
		const sourceError = vi.fn();
		const controls = useMediaControls(fixture.element, {
			src: [
				{ media: "(min-width: 800px)", src: "video.webm", type: "video/webm" },
				{ src: "video.mp4" },
			],
		});
		controls.onSourceError(sourceError);

		const sources = Array.from(fixture.element.querySelectorAll("source"));
		expect(sources).toHaveLength(2);
		expect(sources[0]?.getAttribute("src")).toBe("video.webm");
		expect(sources[0]?.getAttribute("type")).toBe("video/webm");
		expect(sources[0]?.getAttribute("media")).toBe("(min-width: 800px)");
		expect(sources[1]?.getAttribute("src")).toBe("video.mp4");
		expect(fixture.load).toHaveBeenCalledOnce();

		sources[0]?.dispatchEvent(new Event("error"));

		expect(sourceError).toHaveBeenCalledOnce();
	});

	it("injects text track elements", () => {
		const fixture = createMediaFixture();
		useMediaControls(fixture.element, {
			tracks: [
				{
					default: true,
					kind: "subtitles",
					label: "English",
					src: "subtitles.vtt",
					srcLang: "en",
				},
			],
		});

		const track = fixture.element.querySelector("track");
		expect(track?.default).toBe(true);
		expect(track?.kind).toBe("subtitles");
		expect(track?.label).toBe("English");
		expect(track?.src).toContain("subtitles.vtt");
		expect(track?.srclang).toBe("en");
	});

	it("enables and disables text tracks", () => {
		const fixture = createMediaFixture();
		const first = createTextTrack("English");
		const second = createTextTrack("German");
		fixture.textTracks.setTracks([first, second]);
		const controls = useMediaControls(fixture.element);

		expect(controls.tracks.value.map((track) => track.label)).toEqual([
			"English",
			"German",
		]);

		controls.enableTrack(0);

		expect(first.mode).toBe("showing");
		expect(second.mode).toBe("disabled");
		expect(controls.selectedTrack.value).toBe(0);

		controls.enableTrack(1);

		expect(first.mode).toBe("disabled");
		expect(second.mode).toBe("showing");
		expect(controls.selectedTrack.value).toBe(1);

		controls.disableTrack(1);

		expect(second.mode).toBe("disabled");
		expect(controls.selectedTrack.value).toBe(-1);
	});

	it("updates tracks from text track list events", () => {
		const fixture = createMediaFixture();
		const controls = useMediaControls(fixture.element);

		fixture.textTracks.setTracks([createTextTrack("English", "showing")]);
		fixture.textTracks.dispatchEvent(new Event("addtrack"));

		expect(controls.tracks.value).toHaveLength(1);
		expect(controls.selectedTrack.value).toBe(0);

		fixture.textTracks.setTracks([]);
		fixture.textTracks.dispatchEvent(new Event("removetrack"));

		expect(controls.tracks.value).toEqual([]);
		expect(controls.selectedTrack.value).toBe(-1);
	});

	it("toggles picture in picture when supported", async () => {
		const fixture = createMediaFixture();
		const pipWindow = {} as PictureInPictureWindow;
		const requestPictureInPicture = vi.fn(() => Promise.resolve(pipWindow));
		const exitPictureInPicture = vi.fn(() => Promise.resolve());
		Object.defineProperty(fixture.element, "requestPictureInPicture", {
			configurable: true,
			value: requestPictureInPicture,
		});
		const documentLike = Object.assign(document, {
			exitPictureInPicture,
			pictureInPictureEnabled: true,
		});
		const controls = useMediaControls(fixture.element, {
			document: documentLike,
		});

		expect(controls.supportsPictureInPicture.value).toBe(true);
		await expect(controls.togglePictureInPicture()).resolves.toBe(pipWindow);
		expect(requestPictureInPicture).toHaveBeenCalledOnce();

		fixture.element.dispatchEvent(new Event("enterpictureinpicture"));
		await expect(controls.togglePictureInPicture()).resolves.toBeUndefined();
		expect(exitPictureInPicture).toHaveBeenCalledOnce();
	});

	it("reports playback errors", async () => {
		const fixture = createMediaFixture();
		const error = new Error("play failed");
		const playbackError = vi.fn();
		Object.defineProperty(fixture.element, "play", {
			configurable: true,
			value: vi.fn(() => Promise.reject(error)),
		});
		const controls = useMediaControls(fixture.element);
		controls.onPlaybackError(playbackError);

		controls.playing.value = true;
		await Promise.resolve();
		await Promise.resolve();

		expect(playbackError).toHaveBeenCalledWith(error);
		expect(controls.playing.value).toBe(false);
	});

	it("does not create source or track elements when document is null", () => {
		const fixture = createMediaFixture();
		useMediaControls(fixture.element, {
			document: null,
			src: "video.mp4",
			tracks: [
				{
					kind: "subtitles",
					label: "English",
					src: "subtitles.vtt",
					srcLang: "en",
				},
			],
		});

		expect(fixture.element.querySelectorAll("source")).toHaveLength(0);
		expect(fixture.element.querySelectorAll("track")).toHaveLength(0);
		expect(fixture.load).not.toHaveBeenCalled();
	});

	it("rebinds when the target signal changes and stops listeners", () => {
		const first = createMediaFixture();
		const second = createMediaFixture();
		const target = signal<HTMLMediaElement | null>(first.element);
		const controls = useMediaControls(target);

		first.element.currentTime = 5;
		first.element.dispatchEvent(new Event("timeupdate"));
		expect(controls.currentTime.value).toBe(5);

		target.value = second.element;
		second.element.currentTime = 25;
		second.element.dispatchEvent(new Event("timeupdate"));
		expect(controls.currentTime.value).toBe(25);

		second.textTracks.setTracks([createTextTrack("English", "showing")]);
		second.textTracks.dispatchEvent(new Event("addtrack"));
		expect(controls.selectedTrack.value).toBe(0);

		target.value = null;
		expect(controls.tracks.value).toEqual([]);
		expect(controls.selectedTrack.value).toBe(-1);

		target.value = second.element;
		first.element.currentTime = 40;
		first.element.dispatchEvent(new Event("timeupdate"));
		expect(controls.currentTime.value).toBe(25);

		controls.stop();
		second.element.currentTime = 60;
		second.element.dispatchEvent(new Event("timeupdate"));
		expect(controls.currentTime.value).toBe(25);
	});
});
