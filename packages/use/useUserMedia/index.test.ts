import { createScope, disposeScope, runWithScope, signal } from "@sigrea/core";
import { describe, expect, it, vi } from "vitest";

import type {
	UseUserMediaMediaDevicesLike,
	UseUserMediaMediaStreamLike,
	UseUserMediaMediaStreamTrackLike,
	UseUserMediaNavigatorLike,
	UseUserMediaOptions,
} from "../types";
import { useUserMedia } from "./index";

class FakeMediaStreamTrack
	extends EventTarget
	implements UseUserMediaMediaStreamTrackLike
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

class FakeMediaStream implements UseUserMediaMediaStreamLike {
	readonly tracks: FakeMediaStreamTrack[];

	constructor(trackCount = 2) {
		this.tracks = Array.from(
			{ length: trackCount },
			() => new FakeMediaStreamTrack(),
		);
	}

	getTracks(): UseUserMediaMediaStreamTrackLike[] {
		return this.tracks;
	}
}

class FakeMediaDevices
	implements UseUserMediaMediaDevicesLike<FakeMediaStream>
{
	getUserMedia = vi.fn(async () => this.streams.shift() ?? this.stream);

	constructor(
		readonly stream = new FakeMediaStream(),
		readonly streams: FakeMediaStream[] = [],
	) {}
}

function createNavigator(
	mediaDevices?: UseUserMediaMediaDevicesLike<FakeMediaStream> | null,
): UseUserMediaNavigatorLike<FakeMediaStream> {
	return { mediaDevices };
}

function useFakeUserMedia(
	options: UseUserMediaOptions<
		FakeMediaStream,
		UseUserMediaNavigatorLike<FakeMediaStream>
	> = {},
) {
	return useUserMedia<
		FakeMediaStream,
		UseUserMediaNavigatorLike<FakeMediaStream>
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

describe("useUserMedia", () => {
	it("uses fallback values without getUserMedia support", async () => {
		const result = useUserMedia({ navigator: null });

		expect(result.isSupported.value).toBe(false);
		expect(result.isStarting.value).toBe(false);
		expect(result.isStreaming.value).toBe(false);
		expect(result.stream.value).toBeUndefined();
		expect(result.error.value).toBeNull();
		expect(result.enabled.value).toBe(false);
		expect(result.autoSwitch.value).toBe(true);
		expect(result.constraints.value).toEqual({ audio: true, video: true });
		await expect(result.start()).resolves.toBeUndefined();
		await expect(result.restart()).resolves.toBeUndefined();

		result.stop();
	});

	it("starts user media with audio and video by default", async () => {
		const mediaDevices = new FakeMediaDevices();
		const result = useFakeUserMedia({
			navigator: createNavigator(mediaDevices),
		});

		await expect(result.start()).resolves.toBe(mediaDevices.stream);

		expect(result.constraints.value).toEqual({ audio: true, video: true });
		expect(mediaDevices.getUserMedia).toHaveBeenCalledWith({
			audio: true,
			video: true,
		});

		result.stop();
	});

	it("starts user media with the configured constraints", async () => {
		const mediaDevices = new FakeMediaDevices();
		const result = useFakeUserMedia({
			constraints: {
				audio: true,
				video: { facingMode: "user" },
			},
			navigator: createNavigator(mediaDevices),
		});

		await expect(result.start()).resolves.toBe(mediaDevices.stream);

		expect(result.stream.value).toBe(mediaDevices.stream);
		expect(result.isSupported.value).toBe(true);
		expect(result.isStarting.value).toBe(false);
		expect(result.isStreaming.value).toBe(true);
		expect(result.error.value).toBeNull();
		expect(result.enabled.value).toBe(true);
		expect(mediaDevices.getUserMedia).toHaveBeenCalledWith({
			audio: true,
			video: { facingMode: "user" },
		});
		expect(mediaDevices.stream.tracks[0].endedListeners.size).toBe(1);

		result.stop();
	});

	it("shares a pending start request", async () => {
		const request = createDeferred<FakeMediaStream>();
		const mediaDevices = new FakeMediaDevices();
		mediaDevices.getUserMedia = vi.fn(() => request.promise);
		const result = useFakeUserMedia({
			navigator: createNavigator(mediaDevices),
		});

		const firstStart = result.start();
		const secondStart = result.start();

		expect(result.isStarting.value).toBe(true);
		expect(mediaDevices.getUserMedia).toHaveBeenCalledOnce();

		request.resolve(mediaDevices.stream);

		await expect(firstStart).resolves.toBe(mediaDevices.stream);
		await expect(secondStart).resolves.toBe(mediaDevices.stream);
		expect(result.isStarting.value).toBe(false);
		expect(result.isStreaming.value).toBe(true);
		expect(result.enabled.value).toBe(true);

		result.stop();
	});

	it("restarts a pending start request when the navigator changes", async () => {
		const firstRequest = createDeferred<FakeMediaStream>();
		const firstStream = new FakeMediaStream();
		const firstMediaDevices = new FakeMediaDevices(firstStream);
		firstMediaDevices.getUserMedia = vi.fn(() => firstRequest.promise);
		const secondStream = new FakeMediaStream();
		const secondMediaDevices = new FakeMediaDevices(secondStream);
		const navigator = signal(createNavigator(firstMediaDevices));
		const result = useFakeUserMedia({
			enabled: true,
			navigator,
		});

		expect(result.isStarting.value).toBe(true);
		expect(firstMediaDevices.getUserMedia).toHaveBeenCalledOnce();

		navigator.value = createNavigator(secondMediaDevices);
		await vi.waitFor(() => {
			expect(result.stream.value).toBe(secondStream);
		});

		expect(secondMediaDevices.getUserMedia).toHaveBeenCalledOnce();
		firstRequest.resolve(firstStream);
		await Promise.resolve();
		expect(firstStream.tracks[0].stop).toHaveBeenCalledOnce();
		expect(firstStream.tracks[1].stop).toHaveBeenCalledOnce();
		expect(result.stream.value).toBe(secondStream);
		expect(result.enabled.value).toBe(true);

		result.stop();
	});

	it("stores errors when user media is rejected", async () => {
		const error = new Error("NotAllowedError");
		const mediaDevices = new FakeMediaDevices();
		mediaDevices.getUserMedia = vi.fn(async () => {
			throw error;
		});
		const result = useFakeUserMedia({
			navigator: createNavigator(mediaDevices),
		});

		await expect(result.start()).resolves.toBeUndefined();

		expect(result.error.value).toBe(error);
		expect(result.stream.value).toBeUndefined();
		expect(result.isStarting.value).toBe(false);
		expect(result.isStreaming.value).toBe(false);
		expect(result.enabled.value).toBe(false);

		result.stop();
	});

	it("stops all tracks and removes ended listeners", async () => {
		const stream = new FakeMediaStream();
		const result = useFakeUserMedia({
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
		expect(result.enabled.value).toBe(false);

		result.stop();
		expect(stream.tracks[0].stop).toHaveBeenCalledOnce();
		expect(stream.tracks[1].stop).toHaveBeenCalledOnce();
	});

	it("clears the current stream when a track ends", async () => {
		const stream = new FakeMediaStream();
		const result = useFakeUserMedia({
			navigator: createNavigator(new FakeMediaDevices(stream)),
		});

		await result.start();
		stream.tracks[0].end();

		expect(result.stream.value).toBeUndefined();
		expect(result.isStreaming.value).toBe(false);
		expect(result.enabled.value).toBe(false);
		expect(stream.tracks[0].stop).toHaveBeenCalledOnce();
		expect(stream.tracks[1].stop).toHaveBeenCalledOnce();
		expect(stream.tracks[0].endedListeners.size).toBe(0);
	});

	it("stops a stale stream when stopped before start resolves", async () => {
		const request = createDeferred<FakeMediaStream>();
		const stream = new FakeMediaStream();
		const mediaDevices = new FakeMediaDevices(stream);
		mediaDevices.getUserMedia = vi.fn(() => request.promise);
		const result = useFakeUserMedia({
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
		expect(result.enabled.value).toBe(false);
	});

	it("reacts to an enabled source", async () => {
		const enabled = signal(false);
		const stream = new FakeMediaStream();
		const mediaDevices = new FakeMediaDevices(stream);
		const result = useFakeUserMedia({
			enabled,
			navigator: createNavigator(mediaDevices),
		});

		enabled.value = true;
		await vi.waitFor(() => {
			expect(result.stream.value).toBe(stream);
		});
		expect(result.enabled.value).toBe(true);

		enabled.value = false;

		expect(stream.tracks[0].stop).toHaveBeenCalledOnce();
		expect(stream.tracks[1].stop).toHaveBeenCalledOnce();
		expect(result.stream.value).toBeUndefined();
		expect(result.enabled.value).toBe(false);

		result.stop();
	});

	it("restarts when constraints change with autoSwitch enabled", async () => {
		const firstStream = new FakeMediaStream();
		const secondStream = new FakeMediaStream();
		const mediaDevices = new FakeMediaDevices(firstStream, [
			firstStream,
			secondStream,
		]);
		const result = useFakeUserMedia({
			constraints: { audio: false, video: true },
			navigator: createNavigator(mediaDevices),
		});

		await expect(result.start()).resolves.toBe(firstStream);
		result.constraints.value = { audio: true, video: false };
		await vi.waitFor(() => {
			expect(result.stream.value).toBe(secondStream);
		});

		expect(firstStream.tracks[0].stop).toHaveBeenCalledOnce();
		expect(firstStream.tracks[1].stop).toHaveBeenCalledOnce();
		expect(mediaDevices.getUserMedia).toHaveBeenNthCalledWith(1, {
			audio: false,
			video: true,
		});
		expect(mediaDevices.getUserMedia).toHaveBeenNthCalledWith(2, {
			audio: true,
			video: false,
		});

		result.stop();
	});

	it("keeps the current stream when autoSwitch is disabled", async () => {
		const firstStream = new FakeMediaStream();
		const secondStream = new FakeMediaStream();
		const mediaDevices = new FakeMediaDevices(firstStream, [
			firstStream,
			secondStream,
		]);
		const result = useFakeUserMedia({
			autoSwitch: false,
			constraints: { audio: false, video: true },
			navigator: createNavigator(mediaDevices),
		});

		await expect(result.start()).resolves.toBe(firstStream);
		result.constraints.value = { audio: true, video: false };

		expect(result.stream.value).toBe(firstStream);
		expect(mediaDevices.getUserMedia).toHaveBeenCalledOnce();
		expect(firstStream.tracks[0].stop).not.toHaveBeenCalled();

		result.stop();
	});

	it("stops the stream when the scope is disposed", async () => {
		const stream = new FakeMediaStream();
		const scope = createScope();
		const result = runWithScope(scope, () =>
			useFakeUserMedia({
				navigator: createNavigator(new FakeMediaDevices(stream)),
			}),
		);

		await result.start();
		disposeScope(scope);

		expect(stream.tracks[0].stop).toHaveBeenCalledOnce();
		expect(stream.tracks[1].stop).toHaveBeenCalledOnce();
		expect(result.stream.value).toBeUndefined();
		expect(result.isStreaming.value).toBe(false);
		expect(result.enabled.value).toBe(false);
	});
});
