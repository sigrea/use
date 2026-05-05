// @vitest-environment node

import {
	createScope,
	disposeScope,
	disposeTrackedMolecules,
	runWithScope,
	signal,
} from "@sigrea/core";
import { afterEach, describe, expect, it } from "vitest";

import type {
	EyeDropperLike,
	EyeDropperOpenOptions,
	EyeDropperResult,
	UseEyeDropperWindowLike,
} from "../types";
import { useEyeDropper } from "./index";

function createDeferred<T>() {
	let resolve!: (value: T) => void;
	let reject!: (reason?: unknown) => void;
	const promise = new Promise<T>((resolvePromise, rejectPromise) => {
		resolve = resolvePromise;
		reject = rejectPromise;
	});

	return { promise, reject, resolve };
}

class FakeEyeDropper implements EyeDropperLike {
	static instances: FakeEyeDropper[] = [];
	static thrownError: unknown;

	readonly request = createDeferred<EyeDropperResult>();
	openCalls = 0;
	openOptions: EyeDropperOpenOptions | undefined;

	constructor() {
		if (FakeEyeDropper.thrownError !== undefined) {
			throw FakeEyeDropper.thrownError;
		}

		FakeEyeDropper.instances.push(this);
	}

	open(options?: EyeDropperOpenOptions): Promise<EyeDropperResult> {
		this.openCalls += 1;
		this.openOptions = options;

		if (options?.signal?.aborted) {
			return Promise.reject(options.signal.reason);
		}

		options?.signal?.addEventListener(
			"abort",
			() => {
				this.request.reject(options.signal?.reason);
			},
			{ once: true },
		);

		return this.request.promise;
	}
}

class FakeWindow
	extends EventTarget
	implements UseEyeDropperWindowLike<FakeEyeDropper>
{
	readonly EyeDropper = FakeEyeDropper;
}

class UnsupportedWindow extends EventTarget {}

function latestEyeDropper(): FakeEyeDropper {
	const eyeDropper = FakeEyeDropper.instances.at(-1);
	if (eyeDropper === undefined) {
		throw new Error("EyeDropper was not created");
	}

	return eyeDropper;
}

describe("useEyeDropper", () => {
	afterEach(() => {
		FakeEyeDropper.instances = [];
		FakeEyeDropper.thrownError = undefined;
		disposeTrackedMolecules();
	});

	it("does not use global EyeDropper when window is null", async () => {
		const global = globalThis as typeof globalThis & {
			EyeDropper?: unknown;
		};
		const originalEyeDropper = global.EyeDropper;
		Object.defineProperty(globalThis, "EyeDropper", {
			configurable: true,
			value: FakeEyeDropper,
		});

		try {
			const eyeDropper = useEyeDropper({ window: null });

			expect(eyeDropper.isSupported.value).toBe(false);
			expect(eyeDropper.isOpen.value).toBe(false);
			expect(eyeDropper.sRGBHex.value).toBe("");
			expect(eyeDropper.error.value).toBeNull();
			await expect(eyeDropper.open()).resolves.toBeUndefined();
			expect(FakeEyeDropper.instances).toHaveLength(0);
			eyeDropper.abort();
			eyeDropper.stop();
		} finally {
			Object.defineProperty(globalThis, "EyeDropper", {
				configurable: true,
				value: originalEyeDropper,
			});
		}
	});

	it("keeps fallback values when EyeDropper is unsupported", async () => {
		const eyeDropper = useEyeDropper({
			initialValue: "#112233",
			window: new UnsupportedWindow(),
		});

		expect(eyeDropper.isSupported.value).toBe(false);
		expect(eyeDropper.sRGBHex.value).toBe("#112233");
		await expect(eyeDropper.open()).resolves.toBeUndefined();
		expect(eyeDropper.error.value).toBeNull();
		expect(FakeEyeDropper.instances).toHaveLength(0);
	});

	it("opens the native picker and stores the selected color", async () => {
		const signal = new AbortController().signal;
		const eyeDropper = useEyeDropper({
			initialValue: "#000000",
			window: new FakeWindow(),
		});
		const opened = eyeDropper.open({ signal });
		const nativePicker = latestEyeDropper();

		expect(eyeDropper.isSupported.value).toBe(true);
		expect(eyeDropper.isOpen.value).toBe(true);
		expect(nativePicker.openCalls).toBe(1);
		expect(nativePicker.openOptions?.signal).toBeInstanceOf(AbortSignal);
		expect(nativePicker.openOptions?.signal).not.toBe(signal);
		expect(nativePicker.openOptions?.signal?.aborted).toBe(false);

		nativePicker.request.resolve({ sRGBHex: "#aabbcc" });

		await expect(opened).resolves.toEqual({ sRGBHex: "#aabbcc" });
		expect(eyeDropper.sRGBHex.value).toBe("#aabbcc");
		expect(eyeDropper.error.value).toBeNull();
		expect(eyeDropper.isOpen.value).toBe(false);
	});

	it("shares a pending open request", async () => {
		const eyeDropper = useEyeDropper({ window: new FakeWindow() });
		const firstOpen = eyeDropper.open();
		const secondOpen = eyeDropper.open();
		const nativePicker = latestEyeDropper();

		expect(FakeEyeDropper.instances).toHaveLength(1);
		expect(nativePicker.openCalls).toBe(1);
		expect(eyeDropper.isOpen.value).toBe(true);

		nativePicker.request.resolve({ sRGBHex: "#445566" });

		await expect(firstOpen).resolves.toEqual({ sRGBHex: "#445566" });
		await expect(secondOpen).resolves.toEqual({ sRGBHex: "#445566" });
		expect(eyeDropper.sRGBHex.value).toBe("#445566");
		expect(eyeDropper.isOpen.value).toBe(false);
	});

	it("stores rejected open errors and keeps the previous color", async () => {
		const eyeDropper = useEyeDropper({
			initialValue: "#010203",
			window: new FakeWindow(),
		});
		const opened = eyeDropper.open();
		const error = new DOMException("User cancelled", "AbortError");

		latestEyeDropper().request.reject(error);

		await expect(opened).resolves.toBeUndefined();
		expect(eyeDropper.error.value).toBe(error);
		expect(eyeDropper.sRGBHex.value).toBe("#010203");
		expect(eyeDropper.isOpen.value).toBe(false);
	});

	it("stores constructor errors", async () => {
		const error = new Error("blocked");
		FakeEyeDropper.thrownError = error;
		const eyeDropper = useEyeDropper({ window: new FakeWindow() });

		await expect(eyeDropper.open()).resolves.toBeUndefined();

		expect(eyeDropper.error.value).toBe(error);
		expect(eyeDropper.isOpen.value).toBe(false);
		expect(FakeEyeDropper.instances).toHaveLength(0);
	});

	it("forwards external abort signals to the native picker", async () => {
		const controller = new AbortController();
		const reason = new Error("aborted");
		const eyeDropper = useEyeDropper({ window: new FakeWindow() });
		const opened = eyeDropper.open({ signal: controller.signal });
		const nativePicker = latestEyeDropper();

		controller.abort(reason);

		expect(nativePicker.openOptions?.signal?.aborted).toBe(true);
		await expect(opened).resolves.toBeUndefined();
		expect(eyeDropper.error.value).toBe(reason);
		expect(eyeDropper.isOpen.value).toBe(false);
	});

	it("aborts pending requests and ignores late results", async () => {
		const eyeDropper = useEyeDropper({ window: new FakeWindow() });
		const opened = eyeDropper.open();
		const firstPicker = latestEyeDropper();

		eyeDropper.abort();
		firstPicker.request.resolve({ sRGBHex: "#123456" });

		expect(firstPicker.openOptions?.signal?.aborted).toBe(true);
		await expect(opened).resolves.toBeUndefined();
		expect(eyeDropper.sRGBHex.value).toBe("");
		expect(eyeDropper.error.value).toBeNull();
		expect(eyeDropper.isOpen.value).toBe(false);

		const reopened = eyeDropper.open();
		const secondPicker = latestEyeDropper();

		expect(secondPicker).not.toBe(firstPicker);
		secondPicker.request.resolve({ sRGBHex: "#654321" });

		await expect(reopened).resolves.toEqual({ sRGBHex: "#654321" });
		expect(eyeDropper.sRGBHex.value).toBe("#654321");
	});

	it("reacts to window support changes", async () => {
		const windowTarget = signal<
			UseEyeDropperWindowLike<FakeEyeDropper> | null | undefined
		>(null);
		const eyeDropper = useEyeDropper({ window: windowTarget });

		expect(eyeDropper.isSupported.value).toBe(false);
		await expect(eyeDropper.open()).resolves.toBeUndefined();

		windowTarget.value = new FakeWindow();

		expect(eyeDropper.isSupported.value).toBe(true);

		const opened = eyeDropper.open();
		latestEyeDropper().request.resolve({ sRGBHex: "#ddeeff" });

		await expect(opened).resolves.toEqual({ sRGBHex: "#ddeeff" });
		expect(eyeDropper.sRGBHex.value).toBe("#ddeeff");
	});

	it("stops pending requests and prevents future opens", async () => {
		const eyeDropper = useEyeDropper({ window: new FakeWindow() });
		const opened = eyeDropper.open();
		const nativePicker = latestEyeDropper();

		eyeDropper.stop();
		nativePicker.request.resolve({ sRGBHex: "#abcdef" });

		expect(nativePicker.openOptions?.signal?.aborted).toBe(true);
		await expect(opened).resolves.toBeUndefined();
		expect(eyeDropper.isOpen.value).toBe(false);
		expect(eyeDropper.sRGBHex.value).toBe("");
		await expect(eyeDropper.open()).resolves.toBeUndefined();
		expect(FakeEyeDropper.instances).toHaveLength(1);
	});

	it("does not update signals after the scope is disposed", async () => {
		const scope = createScope();
		let eyeDropper!: ReturnType<typeof useEyeDropper>;

		runWithScope(scope, () => {
			eyeDropper = useEyeDropper({ window: new FakeWindow() });
		});

		const opened = eyeDropper.open();
		const nativePicker = latestEyeDropper();

		expect(eyeDropper.isOpen.value).toBe(true);

		disposeScope(scope);
		nativePicker.request.resolve({ sRGBHex: "#abcdef" });

		expect(nativePicker.openOptions?.signal?.aborted).toBe(true);
		await expect(opened).resolves.toBeUndefined();
		expect(eyeDropper.isOpen.value).toBe(false);
		expect(eyeDropper.sRGBHex.value).toBe("");
		await expect(eyeDropper.open()).resolves.toBeUndefined();
	});
});
