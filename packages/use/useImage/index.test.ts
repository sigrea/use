// @vitest-environment node

import { signal } from "@sigrea/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { UseImageOptions, UseImageWindowLike } from "../types";
import { useImage } from "./index";

class FakeImage {
	static readonly instances: FakeImage[] = [];

	alt = "";
	className = "";
	crossOrigin: string | null = null;
	decoding = "";
	fetchPriority = "";
	height = 0;
	isMap = false;
	loading = "";
	onerror: OnErrorEventHandler = null;
	onload: ((this: GlobalEventHandlers, event: Event) => unknown) | null = null;
	referrerPolicy = "";
	sizes = "";
	src = "";
	srcset = "";
	useMap = "";
	width = 0;

	constructor() {
		FakeImage.instances.push(this);
	}

	fail(error: unknown = new Event("error")): void {
		this.onerror?.(error as Event | string);
	}

	load(): void {
		this.onload?.call(
			this as unknown as GlobalEventHandlers,
			new Event("load"),
		);
	}
}

class FakeWindow extends EventTarget implements UseImageWindowLike {
	readonly Image = FakeImage as unknown as { new (): HTMLImageElement };
}

function resetImages(): void {
	FakeImage.instances.length = 0;
}

async function flushPromises(): Promise<void> {
	await Promise.resolve();
	await Promise.resolve();
	await Promise.resolve();
}

describe("useImage", () => {
	afterEach(() => {
		resetImages();
		vi.unstubAllGlobals();
	});

	it("loads an image with the configured attributes", async () => {
		const window = new FakeWindow();
		const image = useImage(
			{
				alt: "Avatar",
				class: "avatar",
				crossorigin: "anonymous",
				decoding: "async",
				fetchPriority: "high",
				height: 64,
				ismap: true,
				loading: "lazy",
				referrerPolicy: "no-referrer",
				sizes: "64px",
				src: "/avatar.png",
				srcset: "/avatar@2x.png 2x",
				usemap: "#avatar-map",
				width: 64,
			},
			{ window },
		);

		expect(image.state.value).toBeUndefined();
		expect(image.isLoading.value).toBe(true);
		expect(FakeImage.instances).toHaveLength(1);

		const element = FakeImage.instances[0];
		expect(element.src).toBe("/avatar.png");
		expect(element.srcset).toBe("/avatar@2x.png 2x");
		expect(element.sizes).toBe("64px");
		expect(element.alt).toBe("Avatar");
		expect(element.className).toBe("avatar");
		expect(element.loading).toBe("lazy");
		expect(element.crossOrigin).toBe("anonymous");
		expect(element.referrerPolicy).toBe("no-referrer");
		expect(element.width).toBe(64);
		expect(element.height).toBe(64);
		expect(element.decoding).toBe("async");
		expect(element.fetchPriority).toBe("high");
		expect(element.isMap).toBe(true);
		expect(element.useMap).toBe("#avatar-map");

		element.load();
		await flushPromises();

		expect(image.state.value).toBe(element);
		expect(image.isReady.value).toBe(true);
		expect(image.isLoading.value).toBe(false);
		expect(image.error.value).toBeUndefined();
		expect(element.onload).toBeNull();
		expect(element.onerror).toBeNull();
	});

	it("tracks load errors through useAsyncState", async () => {
		const failure = new Event("error");
		const onError = vi.fn();
		const image = useImage(
			{ src: "/missing.png" },
			{ window: new FakeWindow(), onError },
		);

		FakeImage.instances[0].fail(failure);
		await flushPromises();

		expect(image.state.value).toBeUndefined();
		expect(image.isReady.value).toBe(false);
		expect(image.isLoading.value).toBe(false);
		expect(image.error.value).toBe(failure);
		expect(onError).toHaveBeenCalledWith(failure);
	});

	it("reacts to option changes and keeps the newest image result", async () => {
		const options = signal<UseImageOptions>({ src: "/first.png" });
		const image = useImage(options, {
			immediate: false,
			window: new FakeWindow(),
		});

		expect(FakeImage.instances).toHaveLength(0);

		options.value = { src: "/second.png" };
		expect(FakeImage.instances).toHaveLength(1);
		const second = FakeImage.instances[0];
		expect(second.src).toBe("/second.png");

		options.value = { src: "/third.png" };
		expect(FakeImage.instances).toHaveLength(2);
		const third = FakeImage.instances[1];
		expect(third.src).toBe("/third.png");

		third.load();
		await flushPromises();
		expect(image.state.value).toBe(third);

		second.load();
		await flushPromises();
		expect(image.state.value).toBe(third);
	});

	it("handles automatic reload failures when throwError is enabled", async () => {
		const failure = new Event("error");
		const options = signal<UseImageOptions>({ src: "/first.png" });
		const onError = vi.fn();
		const image = useImage(options, {
			immediate: false,
			onError,
			throwError: true,
			window: new FakeWindow(),
		});

		options.value = { src: "/broken.png" };
		FakeImage.instances[0].fail(failure);
		await flushPromises();

		expect(image.error.value).toBe(failure);
		expect(onError).toHaveBeenCalledWith(failure);
	});

	it("resets state before reloading unless disabled", async () => {
		const image = useImage(
			{ src: "/avatar.png" },
			{ immediate: false, window: new FakeWindow() },
		);

		const firstPromise = image.execute();
		const first = FakeImage.instances[0];
		first.load();
		await firstPromise;

		expect(image.state.value).toBe(first);

		const secondPromise = image.execute();
		expect(image.state.value).toBeUndefined();
		const second = FakeImage.instances[1];
		second.load();
		await secondPromise;

		expect(image.state.value).toBe(second);
	});

	it("does not fall back to the global Image constructor when window is null", async () => {
		let globalConstructed = 0;
		class GlobalImage {
			constructor() {
				globalConstructed += 1;
			}
		}
		const onError = vi.fn();
		vi.stubGlobal("Image", GlobalImage);
		const image = useImage(
			{ src: "/blocked.png" },
			{ immediate: false, onError, window: null },
		);

		await expect(image.execute()).resolves.toBeUndefined();

		expect(globalConstructed).toBe(0);
		expect(FakeImage.instances).toHaveLength(0);
		expect(image.error.value).toBeInstanceOf(Error);
		expect(onError).toHaveBeenCalledWith(image.error.value);
	});

	it("uses a reactive window target when it becomes available", async () => {
		const windowTarget = signal<UseImageWindowLike | null>(null);
		const onError = vi.fn();
		const image = useImage(
			{ src: "/late.png" },
			{ immediate: false, onError, window: windowTarget },
		);

		await expect(image.execute()).resolves.toBeUndefined();
		expect(FakeImage.instances).toHaveLength(0);
		expect(image.error.value).toBeInstanceOf(Error);

		windowTarget.value = new FakeWindow();
		expect(FakeImage.instances).toHaveLength(1);
		const element = FakeImage.instances[0];
		element.load();
		await flushPromises();

		expect(image.state.value).toBe(element);
		expect(image.error.value).toBeUndefined();
	});
});
