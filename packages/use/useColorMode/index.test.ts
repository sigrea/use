import { disposeTrackedMolecules, signal } from "@sigrea/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import type {
	ColorModeSelection,
	StorageLike,
	UseColorModeDocumentLike,
	UseColorModeWindowLike,
} from "../types";
import { useColorMode } from "./index";

const storageKey = "sigrea-color-scheme";
const darkQuery = "(prefers-color-scheme: dark)";

class FakeStorage implements StorageLike {
	readonly data = new Map<string, string>();
	readonly getItemCalls: string[] = [];
	readonly setItemCalls: Array<[string, string]> = [];
	readonly removeItemCalls: string[] = [];

	getItem(key: string): string | null {
		this.getItemCalls.push(key);
		return this.data.get(key) ?? null;
	}

	setItem(key: string, value: string): void {
		this.setItemCalls.push([key, value]);
		this.data.set(key, value);
	}

	removeItem(key: string): void {
		this.removeItemCalls.push(key);
		this.data.delete(key);
	}
}

class FakeMediaQueryList extends EventTarget implements MediaQueryList {
	media: string;
	matches: boolean;
	onchange:
		| ((this: MediaQueryList, ev: MediaQueryListEvent) => unknown)
		| null = null;

	constructor(media: string, matches: boolean) {
		super();
		this.media = media;
		this.matches = matches;
	}

	addListener(
		listener: (this: MediaQueryList, ev: MediaQueryListEvent) => void,
	): void {
		this.addEventListener("change", listener as EventListener);
	}

	removeListener(
		listener: (this: MediaQueryList, ev: MediaQueryListEvent) => void,
	): void {
		this.removeEventListener("change", listener as EventListener);
	}

	dispatchMatch(matches: boolean): void {
		this.matches = matches;
		const event = new Event("change");
		this.dispatchEvent(event);
		this.onchange?.call(this, event as MediaQueryListEvent);
	}
}

class FakeWindow extends EventTarget implements UseColorModeWindowLike {
	readonly document: UseColorModeDocumentLike;
	readonly localStorage = new FakeStorage();
	readonly queries = new Map<string, FakeMediaQueryList>();
	readonly getComputedStyle = vi.fn(
		(_element: Element) => ({ opacity: "1" }) as CSSStyleDeclaration,
	);

	constructor(documentTarget: UseColorModeDocumentLike = document) {
		super();
		this.document = documentTarget;
	}

	setQuery(query: string, matches: boolean): void {
		this.queries.set(query, new FakeMediaQueryList(query, matches));
	}

	matchMedia(query: string): MediaQueryList {
		let queryList = this.queries.get(query);
		if (queryList === undefined) {
			queryList = new FakeMediaQueryList(query, false);
			this.queries.set(query, queryList);
		}
		return queryList;
	}

	dispatchQuery(query: string, matches: boolean): void {
		const queryList = this.queries.get(query);
		if (queryList === undefined) {
			throw new Error(`Unknown media query: ${query}`);
		}
		queryList.dispatchMatch(matches);
	}
}

describe("useColorMode", () => {
	afterEach(() => {
		document.documentElement.className = "";
		document.documentElement.removeAttribute("data-theme");
		for (const styleElement of Array.from(
			document.head.querySelectorAll("style"),
		)) {
			styleElement.remove();
		}
		disposeTrackedMolecules();
	});

	it("keeps the selected mode and applies the resolved class", () => {
		const fakeWindow = new FakeWindow();
		const colorMode = useColorMode({
			document,
			window: fakeWindow,
		});

		expect(colorMode.mode.value).toBe("auto");
		expect(colorMode.system.value).toBe("light");
		expect(colorMode.resolvedMode.value).toBe("light");
		expect(document.documentElement.classList.contains("light")).toBe(true);
		expect(fakeWindow.localStorage.data.get(storageKey)).toBe("auto");

		colorMode.mode.value = "dark";

		expect(colorMode.mode.value).toBe("dark");
		expect(colorMode.resolvedMode.value).toBe("dark");
		expect(document.documentElement.classList.contains("light")).toBe(false);
		expect(document.documentElement.classList.contains("dark")).toBe(true);
		expect(fakeWindow.localStorage.data.get(storageKey)).toBe("dark");

		colorMode.stop();
	});

	it("tracks system preference while auto is selected", () => {
		const fakeWindow = new FakeWindow();
		fakeWindow.setQuery(darkQuery, true);
		const colorMode = useColorMode({
			document,
			window: fakeWindow,
		});

		expect(colorMode.mode.value).toBe("auto");
		expect(colorMode.system.value).toBe("dark");
		expect(colorMode.resolvedMode.value).toBe("dark");
		expect(document.documentElement.classList.contains("dark")).toBe(true);

		fakeWindow.dispatchQuery(darkQuery, false);

		expect(colorMode.system.value).toBe("light");
		expect(colorMode.resolvedMode.value).toBe("light");
		expect(document.documentElement.classList.contains("light")).toBe(true);

		colorMode.mode.value = "dark";
		fakeWindow.dispatchQuery(darkQuery, false);

		expect(colorMode.resolvedMode.value).toBe("dark");
		expect(document.documentElement.classList.contains("dark")).toBe(true);

		colorMode.stop();
	});

	it("updates attributes without changing unrelated classes", () => {
		document.documentElement.className = "app";
		const fakeWindow = new FakeWindow();
		const colorMode = useColorMode({
			attribute: "data-theme",
			document,
			initialValue: "dark",
			window: fakeWindow,
		});

		expect(document.documentElement.className).toBe("app");
		expect(document.documentElement.getAttribute("data-theme")).toBe("dark");

		colorMode.mode.value = "light";

		expect(document.documentElement.className).toBe("app");
		expect(document.documentElement.getAttribute("data-theme")).toBe("light");

		colorMode.stop();
	});

	it("uses custom DOM mode values while storing logical modes", () => {
		const fakeWindow = new FakeWindow();
		const colorMode = useColorMode<"dim">({
			document,
			modes: {
				dim: "theme-dim high-contrast",
			},
			window: fakeWindow,
		});

		colorMode.mode.value = "dim";

		expect(colorMode.resolvedMode.value).toBe("dim");
		expect(document.documentElement.classList.contains("theme-dim")).toBe(true);
		expect(document.documentElement.classList.contains("high-contrast")).toBe(
			true,
		);
		expect(fakeWindow.localStorage.data.get(storageKey)).toBe("dim");

		colorMode.mode.value = "light";

		expect(document.documentElement.classList.contains("theme-dim")).toBe(
			false,
		);
		expect(document.documentElement.classList.contains("high-contrast")).toBe(
			false,
		);
		expect(document.documentElement.classList.contains("light")).toBe(true);

		colorMode.stop();
	});

	it("does not persist when storageKey is null", () => {
		const fakeWindow = new FakeWindow();
		const colorMode = useColorMode({
			document,
			storageKey: null,
			window: fakeWindow,
		});

		colorMode.mode.value = "dark";

		expect(fakeWindow.localStorage.setItemCalls).toEqual([]);
		expect(fakeWindow.localStorage.data.size).toBe(0);
		expect(document.documentElement.classList.contains("dark")).toBe(true);

		colorMode.stop();
	});

	it("uses storageSignal instead of storage", () => {
		const fakeWindow = new FakeWindow();
		const storageSignal = signal<ColorModeSelection<"sepia"> | null>("sepia");
		const colorMode = useColorMode<"sepia">({
			document,
			modes: {
				sepia: "theme-sepia",
			},
			storageSignal,
			window: fakeWindow,
		});

		expect(colorMode.mode.value).toBe("sepia");
		expect(document.documentElement.classList.contains("theme-sepia")).toBe(
			true,
		);
		expect(fakeWindow.localStorage.data.size).toBe(0);

		colorMode.mode.value = "dark";

		expect(storageSignal.value).toBe("dark");
		expect(document.documentElement.classList.contains("dark")).toBe(true);

		colorMode.stop();
	});

	it("does not stop an externally owned storage signal", () => {
		const fakeWindow = new FakeWindow();
		const storageSignal = signal<ColorModeSelection | null>(
			"auto",
		) as ReturnType<typeof signal<ColorModeSelection | null>> & {
			stop: () => void;
		};
		storageSignal.stop = vi.fn();
		const colorMode = useColorMode({
			document,
			storageSignal,
			window: fakeWindow,
		});

		colorMode.stop();

		expect(storageSignal.stop).not.toHaveBeenCalled();
	});

	it("calls onChanged with a default handler", () => {
		const fakeWindow = new FakeWindow();
		const onChanged = vi.fn((mode, defaultHandler) => {
			defaultHandler(mode);
		});
		const colorMode = useColorMode({
			document,
			onChanged,
			window: fakeWindow,
		});

		expect(onChanged).toHaveBeenCalledWith("light", expect.any(Function));
		expect(document.documentElement.classList.contains("light")).toBe(true);

		colorMode.mode.value = "dark";

		expect(onChanged).toHaveBeenLastCalledWith("dark", expect.any(Function));
		expect(document.documentElement.classList.contains("dark")).toBe(true);

		colorMode.stop();
	});

	it("allows onChanged to override DOM updates", () => {
		const fakeWindow = new FakeWindow();
		const onChanged = vi.fn();
		const colorMode = useColorMode({
			document,
			onChanged,
			window: fakeWindow,
		});

		colorMode.mode.value = "dark";

		expect(onChanged).toHaveBeenLastCalledWith("dark", expect.any(Function));
		expect(document.documentElement.className).toBe("");

		colorMode.stop();
	});

	it("retargets DOM updates when target changes", () => {
		const fakeWindow = new FakeWindow();
		const first = document.createElement("div");
		const second = document.createElement("div");
		const target = signal<Element | null>(first);
		const colorMode = useColorMode({
			document,
			target,
			window: fakeWindow,
		});

		expect(first.classList.contains("light")).toBe(true);
		expect(second.className).toBe("");

		target.value = second;
		colorMode.mode.value = "dark";

		expect(first.classList.contains("light")).toBe(true);
		expect(first.classList.contains("dark")).toBe(false);
		expect(second.classList.contains("dark")).toBe(true);

		colorMode.stop();
	});

	it("retargets window, document, storage, and media query sources", () => {
		const firstDocument = document.implementation.createHTMLDocument("first");
		const secondDocument = document.implementation.createHTMLDocument("second");
		const firstWindow = new FakeWindow(firstDocument);
		const secondWindow = new FakeWindow(secondDocument);
		firstWindow.setQuery(darkQuery, false);
		secondWindow.setQuery(darkQuery, true);
		const currentWindow = signal<UseColorModeWindowLike | null>(firstWindow);
		const colorMode = useColorMode({
			window: currentWindow,
		});

		expect(colorMode.system.value).toBe("light");
		expect(firstDocument.documentElement.classList.contains("light")).toBe(
			true,
		);

		currentWindow.value = secondWindow;

		expect(colorMode.system.value).toBe("dark");
		expect(secondDocument.documentElement.classList.contains("dark")).toBe(
			true,
		);

		firstWindow.dispatchQuery(darkQuery, true);
		expect(colorMode.system.value).toBe("dark");

		secondWindow.dispatchQuery(darkQuery, false);

		expect(colorMode.system.value).toBe("light");
		expect(secondDocument.documentElement.classList.contains("light")).toBe(
			true,
		);

		firstWindow.localStorage.data.set(storageKey, "dark");
		firstWindow.dispatchEvent(
			new CustomEvent("sigrea-storage", {
				detail: {
					key: storageKey,
					newValue: "dark",
					oldValue: "auto",
					storageArea: firstWindow.localStorage,
				},
			}),
		);
		expect(colorMode.mode.value).toBe("auto");

		secondWindow.localStorage.data.set(storageKey, "dark");
		secondWindow.dispatchEvent(
			new CustomEvent("sigrea-storage", {
				detail: {
					key: storageKey,
					newValue: "dark",
					oldValue: "auto",
					storageArea: secondWindow.localStorage,
				},
			}),
		);
		expect(colorMode.mode.value).toBe("dark");

		colorMode.stop();
	});

	it("syncs selected modes through storage events", () => {
		const fakeWindow = new FakeWindow();
		const target = document.createElement("div");
		const first = useColorMode({
			document,
			window: fakeWindow,
		});
		const second = useColorMode({
			document,
			target,
			window: fakeWindow,
		});

		first.mode.value = "dark";

		expect(second.mode.value).toBe("dark");
		expect(target.classList.contains("dark")).toBe(true);

		first.stop();
		second.stop();
	});

	it("skips repeated class operations when the applied class is unchanged", () => {
		const fakeWindow = new FakeWindow();
		const target = document.createElement("div");
		const colorMode = useColorMode({
			document,
			initialValue: "light",
			target,
			window: fakeWindow,
		});
		const add = vi.spyOn(target.classList, "add");
		const remove = vi.spyOn(target.classList, "remove");

		colorMode.mode.value = "light";

		expect(add).not.toHaveBeenCalled();
		expect(remove).not.toHaveBeenCalled();

		colorMode.mode.value = "dark";

		expect(add).toHaveBeenCalledWith("dark");
		expect(remove).toHaveBeenCalledWith("light");

		colorMode.stop();
	});

	it("temporarily disables transitions during DOM updates", () => {
		const fakeWindow = new FakeWindow();
		const appendChild = vi.spyOn(document.head, "appendChild");
		const colorMode = useColorMode({
			document,
			initialValue: "light",
			window: fakeWindow,
		});

		expect(appendChild).toHaveBeenCalled();
		expect(fakeWindow.getComputedStyle).toHaveBeenCalled();
		expect(document.head.querySelectorAll("style").length).toBe(0);

		colorMode.stop();
		appendChild.mockRestore();
	});

	it("stops DOM and media query syncing", () => {
		const fakeWindow = new FakeWindow();
		const colorMode = useColorMode({
			document,
			window: fakeWindow,
		});

		colorMode.stop();
		colorMode.mode.value = "dark";
		fakeWindow.dispatchQuery(darkQuery, true);

		expect(document.documentElement.classList.contains("dark")).toBe(false);
		expect(document.documentElement.classList.contains("light")).toBe(true);
	});

	it("creates a color mode without a browser window", () => {
		const colorMode = useColorMode({
			document: null,
			initialValue: "dark",
			window: null,
		});

		expect(colorMode.mode.value).toBe("dark");
		expect(colorMode.system.value).toBe("light");
		expect(colorMode.resolvedMode.value).toBe("dark");

		colorMode.stop();
	});
});
