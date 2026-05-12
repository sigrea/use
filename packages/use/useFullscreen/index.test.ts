import { disposeTrackedMolecules, signal } from "@sigrea/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import type {
	UseFullscreenDocumentLike,
	UseFullscreenElementLike,
	UseFullscreenEnterOptions,
} from "../types";
import { useFullscreen } from "./index";

class FakeFullscreenElement
	extends EventTarget
	implements UseFullscreenElementLike
{
	requestOptions: Array<UseFullscreenEnterOptions | undefined> = [];
	webkitRequestFullscreen?: UseFullscreenElementLike["webkitRequestFullscreen"];

	constructor(private readonly owner: FakeFullscreenDocument) {
		super();
	}

	requestFullscreen = vi.fn(
		async (options?: UseFullscreenEnterOptions): Promise<void> => {
			this.requestOptions.push(options);
			this.owner.fullscreenElement = this;
			this.owner.dispatchFullscreenChange();
		},
	);
}

class FakeFullscreenDocument
	extends EventTarget
	implements UseFullscreenDocumentLike
{
	documentElement: UseFullscreenElementLike;
	fullscreenElement: UseFullscreenElementLike | null = null;
	fullscreenEnabled = true;

	constructor() {
		super();
		this.documentElement = new FakeFullscreenElement(this);
	}

	exitFullscreen = vi.fn(async (): Promise<void> => {
		this.fullscreenElement = null;
		this.dispatchFullscreenChange();
	});

	dispatchFullscreenChange(): void {
		this.dispatchEvent(new Event("fullscreenchange"));
	}
}

class FakeVendorFullscreenElement
	extends EventTarget
	implements UseFullscreenElementLike
{
	constructor(private readonly owner: FakeVendorFullscreenDocument) {
		super();
	}

	webkitRequestFullscreen = vi.fn(async (): Promise<void> => {
		this.owner.webkitFullscreenElement = this;
		this.owner.dispatchFullscreenChange();
	});
}

class FakeVendorFullscreenDocument
	extends EventTarget
	implements UseFullscreenDocumentLike
{
	documentElement: UseFullscreenElementLike;
	webkitFullscreenElement: UseFullscreenElementLike | null = null;
	webkitFullscreenEnabled = true;

	constructor() {
		super();
		this.documentElement = new FakeVendorFullscreenElement(this);
	}

	webkitExitFullscreen = vi.fn(async (): Promise<void> => {
		this.webkitFullscreenElement = null;
		this.dispatchFullscreenChange();
	});

	dispatchFullscreenChange(): void {
		this.dispatchEvent(new Event("webkitfullscreenchange"));
	}
}

describe("useFullscreen", () => {
	afterEach(() => {
		disposeTrackedMolecules();
		vi.clearAllMocks();
	});

	it("stays unsupported and callable without a document", async () => {
		const fullscreen = useFullscreen(undefined, { document: null });

		expect(fullscreen.isSupported.value).toBe(false);
		expect(fullscreen.isFullscreen.value).toBe(false);

		await fullscreen.enter();
		await fullscreen.exit();
		await fullscreen.toggle();

		expect(fullscreen.isSupported.value).toBe(false);
		expect(fullscreen.isFullscreen.value).toBe(false);

		fullscreen.stop();
	});

	it("uses documentElement when target is not provided", async () => {
		const fakeDocument = new FakeFullscreenDocument();
		const fullscreen = useFullscreen(undefined, { document: fakeDocument });

		expect(fullscreen.isSupported.value).toBe(true);
		expect(fullscreen.isFullscreen.value).toBe(false);

		await fullscreen.enter();

		const element = fakeDocument.documentElement as FakeFullscreenElement;
		expect(element.requestFullscreen).toHaveBeenCalledTimes(1);
		expect(element.requestOptions).toEqual([undefined]);
		expect(fullscreen.isFullscreen.value).toBe(true);

		fullscreen.stop();
	});

	it("does not use documentElement when an explicit target is null", async () => {
		const fakeDocument = new FakeFullscreenDocument();
		const target = signal<UseFullscreenElementLike | null>(null);
		const fullscreen = useFullscreen(target, { document: fakeDocument });

		expect(fullscreen.isSupported.value).toBe(false);

		await fullscreen.enter();

		const element = fakeDocument.documentElement as FakeFullscreenElement;
		expect(element.requestFullscreen).not.toHaveBeenCalled();
		expect(fullscreen.isFullscreen.value).toBe(false);

		fullscreen.stop();
	});

	it("lets enter options override the configured navigationUI", async () => {
		const fakeDocument = new FakeFullscreenDocument();
		const target = fakeDocument.documentElement as FakeFullscreenElement;
		const fullscreen = useFullscreen(target, { document: fakeDocument });

		await fullscreen.enter({ navigationUI: "show" });

		expect(target.requestOptions).toEqual([{ navigationUI: "show" }]);

		fullscreen.stop();
	});

	it("syncs fullscreen state from fullscreenchange events", () => {
		const fakeDocument = new FakeFullscreenDocument();
		const target = fakeDocument.documentElement;
		const fullscreen = useFullscreen(target, { document: fakeDocument });

		fakeDocument.fullscreenElement = target;
		fakeDocument.dispatchFullscreenChange();

		expect(fullscreen.isFullscreen.value).toBe(true);

		fullscreen.stop();
		fakeDocument.fullscreenElement = null;
		fakeDocument.dispatchFullscreenChange();

		expect(fullscreen.isFullscreen.value).toBe(true);
	});

	it("syncs fullscreen state from the target root", () => {
		const fakeDocument = new FakeFullscreenDocument();
		const target = fakeDocument.documentElement as FakeFullscreenElement;
		const root: { fullscreenElement: UseFullscreenElementLike | null } = {
			fullscreenElement: target,
		};
		Object.defineProperty(target, "getRootNode", {
			configurable: true,
			value: () => root,
		});
		const fullscreen = useFullscreen(target, { document: fakeDocument });

		expect(fullscreen.isFullscreen.value).toBe(true);

		root.fullscreenElement = null;
		fakeDocument.dispatchFullscreenChange();

		expect(fullscreen.isFullscreen.value).toBe(false);

		fullscreen.stop();
	});

	it("exits and toggles through the configured document", async () => {
		const fakeDocument = new FakeFullscreenDocument();
		const fullscreen = useFullscreen(fakeDocument.documentElement, {
			document: fakeDocument,
		});

		await fullscreen.enter();
		await fullscreen.toggle();

		expect(fakeDocument.exitFullscreen).toHaveBeenCalledTimes(1);
		expect(fullscreen.isFullscreen.value).toBe(false);

		await fullscreen.toggle();

		expect(fullscreen.isFullscreen.value).toBe(true);

		fullscreen.stop();
	});

	it("exits document fullscreen even after the explicit target is cleared", async () => {
		const fakeDocument = new FakeFullscreenDocument();
		const targetElement = fakeDocument.documentElement as FakeFullscreenElement;
		const target = signal<UseFullscreenElementLike | null>(targetElement);
		const fullscreen = useFullscreen(target, { document: fakeDocument });

		await fullscreen.enter();
		target.value = null;

		await fullscreen.exit();

		expect(fakeDocument.exitFullscreen).toHaveBeenCalledTimes(1);
		expect(fakeDocument.fullscreenElement).toBeNull();
		expect(fullscreen.isFullscreen.value).toBe(false);

		fullscreen.stop();
	});

	it("does not re-enter when the current target is already fullscreen", async () => {
		const fakeDocument = new FakeFullscreenDocument();
		const target = fakeDocument.documentElement as FakeFullscreenElement;
		const fullscreen = useFullscreen(target, { document: fakeDocument });

		await fullscreen.enter();
		target.requestFullscreen.mockClear();
		fakeDocument.exitFullscreen.mockClear();

		await fullscreen.enter({ navigationUI: "hide" });

		expect(fakeDocument.exitFullscreen).not.toHaveBeenCalled();
		expect(target.requestFullscreen).not.toHaveBeenCalled();
		expect(target.requestOptions).toEqual([undefined]);
		expect(fullscreen.isFullscreen.value).toBe(true);

		fullscreen.stop();
	});

	it("keeps the standard request method before vendor fallbacks", async () => {
		const fakeDocument = new FakeFullscreenDocument();
		const target = fakeDocument.documentElement as FakeFullscreenElement;
		target.webkitRequestFullscreen = vi.fn();
		const fullscreen = useFullscreen(target, { document: fakeDocument });

		await fullscreen.enter();

		expect(target.requestFullscreen).toHaveBeenCalledTimes(1);
		expect(target.webkitRequestFullscreen).not.toHaveBeenCalled();

		fullscreen.stop();
	});

	it("uses prefixed fullscreen APIs when standard methods are unavailable", async () => {
		const fakeDocument = new FakeVendorFullscreenDocument();
		const target = fakeDocument.documentElement as FakeVendorFullscreenElement;
		const fullscreen = useFullscreen(target, { document: fakeDocument });

		expect(fullscreen.isSupported.value).toBe(true);

		await fullscreen.enter();

		expect(target.webkitRequestFullscreen).toHaveBeenCalledTimes(1);
		expect(fullscreen.isFullscreen.value).toBe(true);

		await fullscreen.exit();

		expect(fakeDocument.webkitExitFullscreen).toHaveBeenCalledTimes(1);
		expect(fullscreen.isFullscreen.value).toBe(false);

		fullscreen.stop();
	});

	it("uses WebKit video fullscreen state when standard fullscreenElement is null", async () => {
		const fakeDocument = new FakeFullscreenDocument();
		const target = fakeDocument.documentElement as FakeFullscreenElement;
		Object.defineProperty(target, "webkitDisplayingFullscreen", {
			configurable: true,
			value: true,
		});
		Object.defineProperty(target, "webkitExitFullscreen", {
			configurable: true,
			value: vi.fn(async () => {
				Object.defineProperty(target, "webkitDisplayingFullscreen", {
					configurable: true,
					value: false,
				});
				fakeDocument.dispatchFullscreenChange();
			}),
		});
		const fullscreen = useFullscreen(target, { document: fakeDocument });

		expect(
			(fakeDocument as UseFullscreenDocumentLike).fullscreenElement,
		).toBeNull();
		expect(fullscreen.isFullscreen.value).toBe(true);

		await fullscreen.exit();

		expect(
			(target as UseFullscreenElementLike).webkitExitFullscreen,
		).toHaveBeenCalledTimes(1);
		expect(fakeDocument.exitFullscreen).not.toHaveBeenCalled();
		expect(fullscreen.isFullscreen.value).toBe(false);

		fullscreen.stop();
	});

	it("uses WebKit fullscreenElement when the standard fullscreenElement is null", async () => {
		const fakeDocument = new FakeVendorFullscreenDocument();
		const target = fakeDocument.documentElement as FakeFullscreenElement;
		Object.defineProperty(fakeDocument, "fullscreenElement", {
			configurable: true,
			value: null,
		});
		Object.defineProperty(fakeDocument, "webkitFullscreenElement", {
			configurable: true,
			value: target,
		});
		const fullscreen = useFullscreen(target, { document: fakeDocument });

		expect(
			(fakeDocument as UseFullscreenDocumentLike).fullscreenElement,
		).toBeNull();
		expect(fullscreen.isFullscreen.value).toBe(true);

		await fullscreen.exit();

		expect(fakeDocument.webkitExitFullscreen).toHaveBeenCalledTimes(1);
		expect(fullscreen.isFullscreen.value).toBe(false);

		fullscreen.stop();
	});

	it("exits on stop when autoExit is enabled", async () => {
		const fakeDocument = new FakeFullscreenDocument();
		const fullscreen = useFullscreen(fakeDocument.documentElement, {
			autoExit: true,
			document: fakeDocument,
		});

		await fullscreen.enter();
		fullscreen.stop();
		await Promise.resolve();

		expect(fakeDocument.exitFullscreen).toHaveBeenCalledTimes(1);
		expect(fullscreen.isFullscreen.value).toBe(false);
	});

	it("retargets when the target signal changes", async () => {
		const fakeDocument = new FakeFullscreenDocument();
		const firstTarget = fakeDocument.documentElement;
		const secondTarget = new FakeFullscreenElement(fakeDocument);
		const target = signal<UseFullscreenElementLike | null>(firstTarget);
		const fullscreen = useFullscreen(target, { document: fakeDocument });

		await fullscreen.enter();
		expect(fullscreen.isFullscreen.value).toBe(true);

		target.value = secondTarget;
		expect(fullscreen.isFullscreen.value).toBe(false);

		await fullscreen.enter();

		expect(secondTarget.requestFullscreen).toHaveBeenCalledTimes(1);
		expect(fullscreen.isFullscreen.value).toBe(true);

		fullscreen.stop();
	});
});
