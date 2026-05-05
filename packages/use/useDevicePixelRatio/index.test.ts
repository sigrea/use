import {
	disposeTrackedMolecules,
	molecule,
	mountMolecule,
	signal,
	trackMolecule,
} from "@sigrea/core";
import { afterEach, describe, expect, it } from "vitest";

import type { UseDevicePixelRatioWindowLike } from "../types";
import { useDevicePixelRatio } from "./index";

class FakeMediaQueryList extends EventTarget implements MediaQueryList {
	media: string;
	matches: boolean;
	onchange:
		| ((this: MediaQueryList, ev: MediaQueryListEvent) => unknown)
		| null = null;
	private readonly listeners = new Set<EventListenerOrEventListenerObject>();

	constructor(media: string, matches: boolean) {
		super();
		this.media = media;
		this.matches = matches;
	}

	addEventListener(
		type: string,
		callback: EventListenerOrEventListenerObject | null,
		options?: boolean | AddEventListenerOptions,
	): void {
		if (type === "change" && callback !== null) {
			this.listeners.add(callback);
		}
		super.addEventListener(type, callback, options);
	}

	removeEventListener(
		type: string,
		callback: EventListenerOrEventListenerObject | null,
		options?: boolean | EventListenerOptions,
	): void {
		if (type === "change" && callback !== null) {
			this.listeners.delete(callback);
		}
		super.removeEventListener(type, callback, options);
	}

	addListener(
		listener: (this: MediaQueryList, ev: MediaQueryListEvent) => void,
	) {
		this.addEventListener("change", listener as EventListener);
	}

	removeListener(
		listener: (this: MediaQueryList, ev: MediaQueryListEvent) => void,
	) {
		this.removeEventListener("change", listener as EventListener);
	}

	listenerCount() {
		return this.listeners.size;
	}

	dispatchChange(matches: boolean) {
		this.matches = matches;
		const event = new Event("change");
		this.dispatchEvent(event);
		this.onchange?.call(this, event as MediaQueryListEvent);
	}
}

class FakeWindow extends EventTarget implements UseDevicePixelRatioWindowLike {
	devicePixelRatio: number;
	private readonly queries = new Map<string, FakeMediaQueryList>();

	constructor(devicePixelRatio: number) {
		super();
		this.devicePixelRatio = devicePixelRatio;
	}

	matchMedia(query: string): MediaQueryList {
		let queryList = this.queries.get(query);
		if (queryList === undefined) {
			queryList = new FakeMediaQueryList(
				query,
				query === `(resolution: ${this.devicePixelRatio}dppx)`,
			);
			this.queries.set(query, queryList);
		}
		return queryList;
	}

	getQuery(query: string) {
		const queryList = this.queries.get(query);
		if (queryList === undefined) {
			throw new Error(`Unknown media query: ${query}`);
		}
		return queryList;
	}

	dispatchQuery(query: string) {
		const queryList = this.getQuery(query);
		queryList.dispatchChange(
			query === `(resolution: ${this.devicePixelRatio}dppx)`,
		);
	}
}

class FakeWindowWithoutMatchMedia
	extends EventTarget
	implements UseDevicePixelRatioWindowLike
{
	devicePixelRatio: number;

	constructor(devicePixelRatio: number) {
		super();
		this.devicePixelRatio = devicePixelRatio;
	}
}

describe("useDevicePixelRatio", () => {
	afterEach(() => {
		disposeTrackedMolecules();
	});

	it("uses a fallback value without a window", () => {
		const result = useDevicePixelRatio({
			initialValue: 2,
			window: null,
		});

		expect(result.pixelRatio.value).toBe(2);
		result.stop();
	});

	it("reads the current pixel ratio before molecule mount", () => {
		const window = new FakeWindow(2);
		const PixelRatioMolecule = molecule(() => useDevicePixelRatio({ window }));
		const instance = PixelRatioMolecule();
		trackMolecule(instance);

		expect(instance.pixelRatio.value).toBe(2);

		mountMolecule(instance);
		window.devicePixelRatio = 3;
		window.dispatchQuery("(resolution: 2dppx)");

		expect(instance.pixelRatio.value).toBe(3);
		instance.stop();
	});

	it("updates the pixel ratio when the resolution media query changes", () => {
		const window = new FakeWindow(1);
		const result = useDevicePixelRatio({ window });

		expect(result.pixelRatio.value).toBe(1);
		expect(window.getQuery("(resolution: 1dppx)").listenerCount()).toBe(1);

		window.devicePixelRatio = 2;
		window.dispatchQuery("(resolution: 1dppx)");

		expect(result.pixelRatio.value).toBe(2);
		expect(window.getQuery("(resolution: 1dppx)").listenerCount()).toBe(0);
		expect(window.getQuery("(resolution: 2dppx)").listenerCount()).toBe(1);

		window.devicePixelRatio = 1.5;
		window.dispatchQuery("(resolution: 2dppx)");

		expect(result.pixelRatio.value).toBe(1.5);
		expect(window.getQuery("(resolution: 2dppx)").listenerCount()).toBe(0);
		expect(window.getQuery("(resolution: 1.5dppx)").listenerCount()).toBe(1);

		result.stop();
		expect(window.getQuery("(resolution: 1.5dppx)").listenerCount()).toBe(0);
	});

	it("retargets listeners when the window changes", () => {
		const firstWindow = new FakeWindow(1);
		const secondWindow = new FakeWindow(2);
		const currentWindow = signal<FakeWindow | null>(firstWindow);
		const result = useDevicePixelRatio({ window: currentWindow });

		expect(result.pixelRatio.value).toBe(1);
		expect(firstWindow.getQuery("(resolution: 1dppx)").listenerCount()).toBe(1);

		currentWindow.value = secondWindow;

		expect(result.pixelRatio.value).toBe(2);
		expect(firstWindow.getQuery("(resolution: 1dppx)").listenerCount()).toBe(0);
		expect(secondWindow.getQuery("(resolution: 2dppx)").listenerCount()).toBe(
			1,
		);

		secondWindow.devicePixelRatio = 3;
		secondWindow.dispatchQuery("(resolution: 2dppx)");

		expect(result.pixelRatio.value).toBe(3);

		firstWindow.devicePixelRatio = 4;
		firstWindow.dispatchQuery("(resolution: 1dppx)");

		expect(result.pixelRatio.value).toBe(3);

		currentWindow.value = null;

		expect(result.pixelRatio.value).toBe(1);
		expect(secondWindow.getQuery("(resolution: 3dppx)").listenerCount()).toBe(
			0,
		);

		result.stop();
	});

	it("reads once when matchMedia is unavailable", () => {
		const window = new FakeWindowWithoutMatchMedia(2);
		const result = useDevicePixelRatio({ window });

		expect(result.pixelRatio.value).toBe(2);

		window.devicePixelRatio = 3;
		expect(result.pixelRatio.value).toBe(2);
		result.stop();
	});
});
