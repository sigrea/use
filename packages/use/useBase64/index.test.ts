import { signal } from "@sigrea/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { UseBase64Return, UseBase64WindowLike } from "../types";
import { useBase64 } from "./index";

type CrossRealmWindow = Window & {
	readonly Blob: typeof Blob;
	readonly Map: MapConstructor;
	readonly Set: SetConstructor;
};

async function waitForCurrentPromise(result: UseBase64Return): Promise<string> {
	expect(result.promise.value).toBeInstanceOf(Promise);

	return result.promise.value as Promise<string>;
}

function getFrameWindow(frame: HTMLIFrameElement): CrossRealmWindow {
	if (frame.contentWindow === null) {
		throw new Error("iframe window is not available");
	}

	return frame.contentWindow as CrossRealmWindow;
}

describe("useBase64", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("converts records", async () => {
		const result = useBase64({ test: 5 });

		await waitForCurrentPromise(result);

		expect(result.base64.value).toBe(
			"data:application/json;base64,eyJ0ZXN0Ijo1fQ==",
		);
	});

	it("converts maps with the default serializer", async () => {
		const result = useBase64(new Map([["test", 1]]));

		await waitForCurrentPromise(result);

		expect(result.base64.value).toBe(
			"data:application/json;base64,eyJ0ZXN0IjoxfQ==",
		);
	});

	it("converts maps from another realm with the default serializer", async () => {
		const iframe = document.createElement("iframe");
		document.body.append(iframe);

		try {
			const frameWindow = getFrameWindow(iframe);
			const map = new frameWindow.Map([["test", 1]]) as Map<string, unknown>;
			expect(map).not.toBeInstanceOf(Map);

			const result = useBase64(map);

			await waitForCurrentPromise(result);

			expect(result.base64.value).toBe(
				"data:application/json;base64,eyJ0ZXN0IjoxfQ==",
			);
		} finally {
			iframe.remove();
		}
	});

	it("converts sets", async () => {
		const result = useBase64(new Set([1]));

		await waitForCurrentPromise(result);

		expect(result.base64.value).toBe("data:application/json;base64,WzFd");
	});

	it("converts sets from another realm", async () => {
		const iframe = document.createElement("iframe");
		document.body.append(iframe);

		try {
			const frameWindow = getFrameWindow(iframe);
			const set = new frameWindow.Set([1]) as Set<unknown>;
			expect(set).not.toBeInstanceOf(Set);

			const result = useBase64(set);

			await waitForCurrentPromise(result);

			expect(result.base64.value).toBe("data:application/json;base64,WzFd");
		} finally {
			iframe.remove();
		}
	});

	it("keeps tagged records as records", async () => {
		const result = useBase64({
			[Symbol.toStringTag]: "Map",
			test: 1,
		} as Record<string, unknown>);

		await waitForCurrentPromise(result);

		expect(result.base64.value).toBe(
			"data:application/json;base64,eyJ0ZXN0IjoxfQ==",
		);
	});

	it("converts arrays", async () => {
		const result = useBase64([1, 2, 3]);

		await waitForCurrentPromise(result);

		expect(result.base64.value).toBe(
			"data:application/json;base64,WzEsMiwzXQ==",
		);
	});

	it("uses custom serializers for object sources", async () => {
		const result = useBase64([1, 2, 3], {
			serializer: (array) => JSON.stringify(array.map((value) => value * 2)),
		});

		await waitForCurrentPromise(result);

		expect(result.base64.value).toBe(
			"data:application/json;base64,WzIsNCw2XQ==",
		);
	});

	it("can return raw base64 without the data URL prefix", async () => {
		const result = useBase64([1, 2, 3], { dataUrl: false });

		await waitForCurrentPromise(result);

		expect(result.base64.value).toBe("WzEsMiwzXQ==");
	});

	it("converts strings as text data URLs", async () => {
		const result = useBase64("hello");

		await waitForCurrentPromise(result);

		expect(result.base64.value).toBe("data:text/plain;base64,aGVsbG8=");
	});

	it("converts blobs", async () => {
		const result = useBase64(new Blob(["hello"], { type: "text/custom" }));

		await waitForCurrentPromise(result);

		expect(result.base64.value).toBe("data:text/custom;base64,aGVsbG8=");
	});

	it("converts blobs created by a supplied window", async () => {
		const iframe = document.createElement("iframe");
		document.body.append(iframe);

		try {
			const foreignWindow = getFrameWindow(iframe);
			const windowLike = foreignWindow as unknown as UseBase64WindowLike;

			const blob = new foreignWindow.Blob(["hello"], {
				type: "text/custom",
			});
			expect(blob).not.toBeInstanceOf(Blob);

			const result = useBase64(blob as Blob, {
				window: windowLike,
			});

			await waitForCurrentPromise(result);

			expect(result.base64.value).toBe("data:text/custom;base64,aGVsbG8=");
		} finally {
			iframe.remove();
		}
	});

	it("converts array buffers to raw base64", async () => {
		const result = useBase64(new Uint8Array([104, 101, 108, 108, 111]).buffer);

		await waitForCurrentPromise(result);

		expect(result.base64.value).toBe("aGVsbG8=");
	});

	it("converts canvas elements with image options", async () => {
		const canvas = document.createElement("canvas");
		const toDataURL = vi.fn(() => "data:image/jpeg;base64,canvas");
		Object.defineProperty(canvas, "toDataURL", {
			configurable: true,
			value: toDataURL,
		});

		const result = useBase64(canvas, {
			type: "image/jpeg",
			quality: 0.8,
		});

		await waitForCurrentPromise(result);

		expect(result.base64.value).toBe("data:image/jpeg;base64,canvas");
		expect(toDataURL).toHaveBeenCalledWith("image/jpeg", 0.8);
	});

	it("converts image elements through a canvas", async () => {
		const image = document.createElement("img");
		const clone = document.createElement("img");
		const canvas = document.createElement("canvas");
		const drawImage = vi.fn();
		const originalCreateElement = document.createElement.bind(document);

		Object.defineProperties(clone, {
			complete: { configurable: true, value: true },
			height: { configurable: true, value: 4 },
			width: { configurable: true, value: 2 },
		});
		vi.spyOn(image, "cloneNode").mockReturnValue(clone);
		vi.spyOn(canvas, "getContext").mockReturnValue({
			drawImage,
		} as unknown as CanvasRenderingContext2D);
		vi.spyOn(canvas, "toDataURL").mockReturnValue(
			"data:image/webp;base64,image",
		);
		vi.spyOn(document, "createElement").mockImplementation(((
			tagName: string,
			options?: ElementCreationOptions,
		) => {
			if (tagName === "canvas") {
				return canvas;
			}

			return originalCreateElement(tagName, options);
		}) as typeof document.createElement);

		const result = useBase64(image, {
			type: "image/webp",
			quality: 0.9,
		});

		await waitForCurrentPromise(result);

		expect(clone.crossOrigin).toBe("Anonymous");
		expect(drawImage).toHaveBeenCalledWith(clone, 0, 0, 2, 4);
		expect(result.base64.value).toBe("data:image/webp;base64,image");
	});

	it("resolves nullish sources to an empty string", async () => {
		const result = useBase64(undefined);

		await waitForCurrentPromise(result);

		expect(result.base64.value).toBe("");
	});

	it("rejects unsupported sources without changing the current value", async () => {
		const result = useBase64("hello");
		await waitForCurrentPromise(result);

		const unsupported = useBase64(1 as unknown as string);

		await expect(unsupported.promise.value).rejects.toThrow(
			"target is unsupported types",
		);
		expect(unsupported.base64.value).toBe("");
	});

	it("rejects getter errors without throwing on creation", async () => {
		const error = new Error("source failed");
		const result = useBase64(() => {
			throw error;
		});

		await expect(result.promise.value).rejects.toBe(error);
		expect(result.base64.value).toBe("");
		await expect(result.execute()).rejects.toBe(error);
	});

	it("rejects window getter errors without throwing on creation", async () => {
		const error = new Error("window failed");
		const result = useBase64("hello", {
			window: () => {
				throw error;
			},
		});

		await expect(result.promise.value).rejects.toBe(error);
		expect(result.base64.value).toBe("");
	});

	it("reacts to signal and getter source changes", async () => {
		const source = signal("first");
		const result = useBase64(() => source.value);

		await waitForCurrentPromise(result);
		expect(result.base64.value).toBe("data:text/plain;base64,Zmlyc3Q=");

		source.value = "second";
		await waitForCurrentPromise(result);

		expect(result.base64.value).toBe("data:text/plain;base64,c2Vjb25k");
	});

	it("uses the current source when execute is called", async () => {
		const source = signal("first");
		const result = useBase64(source, { dataUrl: false });
		await waitForCurrentPromise(result);

		source.value = "second";
		await result.execute();

		expect(result.base64.value).toBe("c2Vjb25k");
	});

	it("keeps the latest result when conversions resolve out of order", async () => {
		let readCount = 0;
		class FakeFileReader {
			onerror: ((event: ProgressEvent<FileReader>) => unknown) | null = null;
			onload: ((event: ProgressEvent<FileReader>) => unknown) | null = null;
			result: string | ArrayBuffer | null = null;

			readAsDataURL(_blob: Blob) {
				readCount += 1;
				const text = readCount === 1 ? "slow" : "fast";

				setTimeout(
					() => {
						this.result = `data:text/plain;base64,${text}`;
						this.onload?.({
							target: this,
						} as unknown as ProgressEvent<FileReader>);
					},
					text === "slow" ? 20 : 0,
				);
			}
		}

		const source = signal("slow");
		const result = useBase64(source, {
			window: {
				FileReader: FakeFileReader as unknown as { new (): FileReader },
			} as UseBase64WindowLike,
		});
		const slowPromise = result.promise.value;

		source.value = "fast";
		await waitForCurrentPromise(result);
		expect(result.base64.value).toBe("data:text/plain;base64,fast");

		await slowPromise;
		expect(result.base64.value).toBe("data:text/plain;base64,fast");
	});
});
