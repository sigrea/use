import { disposeTrackedMolecules, signal } from "@sigrea/core";
import { afterEach, describe, expect, it } from "vitest";

import type { OnlineNavigatorLike, WindowLike } from "../types";
import { useOnline } from "./index";

class FakeNavigator implements OnlineNavigatorLike {
	onLine: boolean;
	readonly userAgent = "fake";

	constructor(onLine: boolean) {
		this.onLine = onLine;
	}
}

class FakeWindow extends EventTarget implements WindowLike {
	readonly navigator: FakeNavigator;

	constructor(onLine: boolean) {
		super();
		this.navigator = new FakeNavigator(onLine);
	}

	dispatchOnline(onLine: boolean) {
		this.navigator.onLine = onLine;
		this.dispatchEvent(new Event(onLine ? "online" : "offline"));
	}
}

describe("useOnline", () => {
	afterEach(() => {
		disposeTrackedMolecules();
	});

	it("reads navigator.onLine as the initial value", () => {
		const fakeWindow = new FakeWindow(false);
		const online = useOnline({
			window: fakeWindow,
		});

		expect(online.isOnline.value).toBe(false);

		online.stop();
	});

	it("tracks online and offline events", () => {
		const fakeWindow = new FakeWindow(false);
		const online = useOnline({
			window: fakeWindow,
		});

		fakeWindow.dispatchOnline(true);
		expect(online.isOnline.value).toBe(true);

		fakeWindow.dispatchOnline(false);
		expect(online.isOnline.value).toBe(false);

		online.stop();
		fakeWindow.dispatchOnline(true);
		expect(online.isOnline.value).toBe(false);
	});

	it("uses a safe online value when navigator is unavailable", () => {
		const online = useOnline({
			navigator: null,
			window: null,
		});

		expect(online.isOnline.value).toBe(true);

		online.stop();
	});

	it("does not fall back to window.navigator when navigator is null", () => {
		const fakeWindow = new FakeWindow(false);
		const online = useOnline({
			navigator: null,
			window: fakeWindow,
		});

		expect(online.isOnline.value).toBe(true);

		fakeWindow.dispatchOnline(false);
		expect(online.isOnline.value).toBe(true);

		online.stop();
	});

	it("falls back to window.navigator when navigator is undefined", () => {
		const fakeWindow = new FakeWindow(false);
		const online = useOnline({
			navigator: undefined,
			window: fakeWindow,
		});

		expect(online.isOnline.value).toBe(false);

		online.stop();
	});

	it("falls back to window.navigator while reactive navigator is undefined", () => {
		const fakeWindow = new FakeWindow(false);
		const navigator = signal<OnlineNavigatorLike | null | undefined>(undefined);
		const online = useOnline({
			navigator,
			window: fakeWindow,
		});

		expect(online.isOnline.value).toBe(false);

		navigator.value = new FakeNavigator(true);
		expect(online.isOnline.value).toBe(true);

		navigator.value = undefined;
		expect(online.isOnline.value).toBe(false);

		online.stop();
	});

	it("accepts a navigator separate from the event window", () => {
		const fakeWindow = new FakeWindow(true);
		const fakeNavigator = new FakeNavigator(false);
		const online = useOnline({
			navigator: fakeNavigator,
			window: fakeWindow,
		});

		expect(online.isOnline.value).toBe(false);

		fakeNavigator.onLine = true;
		fakeWindow.dispatchEvent(new Event("online"));
		expect(online.isOnline.value).toBe(true);

		online.stop();
	});

	it("retargets listeners when the window changes", () => {
		const firstWindow = new FakeWindow(false);
		const secondWindow = new FakeWindow(true);
		const windowTarget = signal<WindowLike | null>(firstWindow);
		const online = useOnline({
			window: windowTarget,
		});

		expect(online.isOnline.value).toBe(false);

		windowTarget.value = secondWindow;
		expect(online.isOnline.value).toBe(true);

		firstWindow.dispatchOnline(false);
		expect(online.isOnline.value).toBe(true);

		secondWindow.dispatchOnline(false);
		expect(online.isOnline.value).toBe(false);

		online.stop();
	});
});
