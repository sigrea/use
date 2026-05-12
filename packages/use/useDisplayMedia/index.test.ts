import { signal } from "@sigrea/core";
import { describe, expect, it, vi } from "vitest";

import type {
	UseDisplayMediaMediaDevicesLike,
	UseDisplayMediaMediaStreamLike,
	UseDisplayMediaMediaStreamTrackLike,
	UseDisplayMediaNavigatorLike,
	UseDisplayMediaOptions,
} from "../types";
import { useDisplayMedia } from "./index";

class FakeMediaStreamTrack
	extends EventTarget
	implements UseDisplayMediaMediaStreamTrackLike
{
	readonly endedListeners = new Set<EventListenerOrEventListenerObject>();
	readonly stop = vi.fn();

	addEventListener(
		type: string,
		callback: EventListenerOrEventListenerObject | null,
		options?: boolean | AddEventListenerOptions,
	): void {
		if (type === "ended" && callback !== null) {
			this.endedListeners.add(callback);
		}
		super.addEventListener(type, callback, options);
	}

	removeEventListener(
		type: string,
		callback: EventListenerOrEventListenerObject | null,
		options?: boolean | EventListenerOptions,
	): void {
		if (type === "ended" && callback !== null) {
			this.endedListeners.delete(callback);
		}
		super.removeEventListener(type, callback, options);
	}

	end(): void {
		this.dispatchEvent(new Event("ended"));
	}
}

class FakeMediaStream implements UseDisplayMediaMediaStreamLike {
	readonly tracks: FakeMediaStreamTrack[];

	constructor(trackCount = 2) {
		this.tracks = Array.from(
			{ length: trackCount },
			() => new FakeMediaStreamTrack(),
		);
	}

	getTracks(): UseDisplayMediaMediaStreamTrackLike[] {
		return this.tracks;
	}
}

class FakeMediaDevices
	implements UseDisplayMediaMediaDevicesLike<FakeMediaStream>
{
	getDisplayMedia = vi.fn(async () => this.stream);

	constructor(readonly stream = new FakeMediaStream()) {}
}

function createNavigator(
	mediaDevices?: UseDisplayMediaMediaDevicesLike<FakeMediaStream> | null,
): UseDisplayMediaNavigatorLike<FakeMediaStream> {
	return { mediaDevices };
}

function useFakeDisplayMedia(
	options: UseDisplayMediaOptions<
		FakeMediaStream,
		UseDisplayMediaNavigatorLike<FakeMediaStream>
	> = {},
) {
	return useDisplayMedia<
		FakeMediaStream,
		UseDisplayMediaNavigatorLike<FakeMediaStream>
	>(options);
}

function createDeferred<T>() {
	let resolve!: (value: T) => void;
	let reject!: (reason?: unknown) => void;
	const promise = new Promise<T>((resolvePromise, rejectPromise) => {
		resolve = resolvePromise;
		reject = rejectPromise;
	});

	return { promise, reject, resolve };
}

describe("useDisplayMedia", () => {
	it("uses fallback values without getDisplayMedia support", async () => {
		const result = useDisplayMedia({ navigator: null });

		expect(result.isSupported.value).toBe(false);
		expect(result.isStarting.value).toBe(false);
		expect(result.isStreaming.value).toBe(false);
		expect(result.stream.value).toBeUndefined();
		expect(result.error.value).toBeNull();
		await expect(result.start()).resolves.toBeUndefined();

		result.stop();
	});

	it("starts display capture with the configured constraints", async () => {
		const mediaDevices = new FakeMediaDevices();
		const result = useFakeDisplayMedia({
			constraints: {
				audio: true,
				video: { displaySurface: "browser" },
			},
			navigator: createNavigator(mediaDevices),
		});

		await expect(result.start()).resolves.toBe(mediaDevices.stream);

		expect(result.stream.value).toBe(mediaDevices.stream);
		expect(result.isSupported.value).toBe(true);
		expect(result.isStarting.value).toBe(false);
		expect(result.isStreaming.value).toBe(true);
		expect(result.error.value).toBeNull();
		expect(mediaDevices.getDisplayMedia).toHaveBeenCalledWith({
			audio: true,
			video: { displaySurface: "browser" },
		});
		expect(mediaDevices.stream.tracks[0].endedListeners.size).toBe(1);

		result.stop();
	});

	it("shares a pending start request", async () => {
		const request = createDeferred<FakeMediaStream>();
		const mediaDevices = new FakeMediaDevices();
		mediaDevices.getDisplayMedia = vi.fn(() => request.promise);
		const result = useFakeDisplayMedia({
			navigator: createNavigator(mediaDevices),
		});

		const firstStart = result.start();
		const secondStart = result.start();

		expect(result.isStarting.value).toBe(true);
		expect(mediaDevices.getDisplayMedia).toHaveBeenCalledOnce();

		request.resolve(mediaDevices.stream);

		await expect(firstStart).resolves.toBe(mediaDevices.stream);
		await expect(secondStart).resolves.toBe(mediaDevices.stream);
		expect(result.isStarting.value).toBe(false);
		expect(result.isStreaming.value).toBe(true);

		result.stop();
	});

	it("stores errors when display capture is rejected", async () => {
		const error = new Error("NotAllowedError");
		const mediaDevices = new FakeMediaDevices();
		mediaDevices.getDisplayMedia = vi.fn(async () => {
			throw error;
		});
		const result = useFakeDisplayMedia({
			navigator: createNavigator(mediaDevices),
		});

		await expect(result.start()).resolves.toBeUndefined();

		expect(result.error.value).toBe(error);
		expect(result.stream.value).toBeUndefined();
		expect(result.isStarting.value).toBe(false);
		expect(result.isStreaming.value).toBe(false);

		result.stop();
	});

	it("stops all tracks and removes ended listeners", async () => {
		const stream = new FakeMediaStream();
		const result = useFakeDisplayMedia({
			navigator: createNavigator(new FakeMediaDevices(stream)),
		});

		await result.start();
		result.stop();

		expect(stream.tracks[0].stop).toHaveBeenCalledOnce();
		expect(stream.tracks[1].stop).toHaveBeenCalledOnce();
		expect(stream.tracks[0].endedListeners.size).toBe(0);
		expect(stream.tracks[1].endedListeners.size).toBe(0);
		expect(result.stream.value).toBeUndefined();
		expect(result.isStreaming.value).toBe(false);

		result.stop();
		expect(stream.tracks[0].stop).toHaveBeenCalledOnce();
		expect(stream.tracks[1].stop).toHaveBeenCalledOnce();
	});

	it("keeps the current stream until all tracks end", async () => {
		const stream = new FakeMediaStream();
		const result = useFakeDisplayMedia({
			navigator: createNavigator(new FakeMediaDevices(stream)),
		});

		await result.start();
		stream.tracks[0].end();

		expect(result.stream.value).toBe(stream);
		expect(result.isStreaming.value).toBe(true);
		expect(stream.tracks[0].stop).not.toHaveBeenCalled();
		expect(stream.tracks[1].stop).not.toHaveBeenCalled();
		expect(stream.tracks[0].endedListeners.size).toBe(1);

		stream.tracks[1].end();

		expect(result.stream.value).toBeUndefined();
		expect(result.isStreaming.value).toBe(false);
		expect(stream.tracks[0].stop).toHaveBeenCalledOnce();
		expect(stream.tracks[1].stop).toHaveBeenCalledOnce();
		expect(stream.tracks[0].endedListeners.size).toBe(0);
		expect(stream.tracks[1].endedListeners.size).toBe(0);
	});

	it("stops a stale stream when stopped before start resolves", async () => {
		const request = createDeferred<FakeMediaStream>();
		const stream = new FakeMediaStream();
		const mediaDevices = new FakeMediaDevices(stream);
		mediaDevices.getDisplayMedia = vi.fn(() => request.promise);
		const result = useFakeDisplayMedia({
			navigator: createNavigator(mediaDevices),
		});
		const started = result.start();

		result.stop();
		request.resolve(stream);

		await expect(started).resolves.toBeUndefined();
		expect(stream.tracks[0].stop).toHaveBeenCalledOnce();
		expect(stream.tracks[1].stop).toHaveBeenCalledOnce();
		expect(result.stream.value).toBeUndefined();
		expect(result.isStreaming.value).toBe(false);
	});

	it("stops a stale stream when the navigator changes before start resolves", async () => {
		const request = createDeferred<FakeMediaStream>();
		const firstStream = new FakeMediaStream();
		const firstMediaDevices = new FakeMediaDevices(firstStream);
		firstMediaDevices.getDisplayMedia = vi.fn(() => request.promise);
		const secondMediaDevices = new FakeMediaDevices(new FakeMediaStream());
		const navigator =
			signal<UseDisplayMediaNavigatorLike<FakeMediaStream> | null>(
				createNavigator(firstMediaDevices),
			);
		const result = useFakeDisplayMedia({ navigator });
		const started = result.start();

		navigator.value = createNavigator(secondMediaDevices);
		request.resolve(firstStream);

		await expect(started).resolves.toBeUndefined();
		expect(firstStream.tracks[0].stop).toHaveBeenCalledOnce();
		expect(firstStream.tracks[1].stop).toHaveBeenCalledOnce();
		expect(result.stream.value).toBeUndefined();
		expect(result.isSupported.value).toBe(true);

		await expect(result.start()).resolves.toBe(secondMediaDevices.stream);
		expect(result.stream.value).toBe(secondMediaDevices.stream);

		result.stop();
	});

	it("reacts to an enabled source", async () => {
		const enabled = signal(false);
		const stream = new FakeMediaStream();
		const mediaDevices = new FakeMediaDevices(stream);
		const result = useFakeDisplayMedia({
			enabled,
			navigator: createNavigator(mediaDevices),
		});

		enabled.value = true;
		await vi.waitFor(() => {
			expect(result.stream.value).toBe(stream);
		});

		enabled.value = false;

		expect(stream.tracks[0].stop).toHaveBeenCalledOnce();
		expect(stream.tracks[1].stop).toHaveBeenCalledOnce();
		expect(result.stream.value).toBeUndefined();

		result.stop();
	});
});
