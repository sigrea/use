import { disposeTrackedMolecules, signal } from "@sigrea/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import type {
	StorageLike,
	UseColorModeDocumentLike,
	UseColorModeWindowLike,
} from "../types";
import { useDark } from "./index";

const darkQuery = "(prefers-color-scheme: dark)";
const storageKey = "sigrea-color-scheme";

class FakeStorage implements StorageLike {
	readonly data = new Map<string, string>();

	getItem(key: string): string | null {
		return this.data.get(key) ?? null;
	}

	setItem(key: string, value: string): void {
		this.data.set(key, value);
	}

	removeItem(key: string): void {
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

describe("useDark", () => {
	afterEach(() => {
		document.documentElement.className = "";
		document.documentElement.removeAttribute("data-theme");
		document.body.className = "";
		document.body.removeAttribute("data-theme");
		for (const styleElement of Array.from(
			document.head.querySelectorAll("style"),
		)) {
			styleElement.remove();
		}
		disposeTrackedMolecules();
	});

	it("applies the dark class through useColorMode", () => {
		const fakeWindow = new FakeWindow();
		fakeWindow.setQuery(darkQuery, false);
		const isDark = useDark({
			document,
			initialValue: "light",
			window: fakeWindow,
		});

		expect(isDark.value).toBe(false);
		expect(document.documentElement.classList.contains("dark")).toBe(false);
		expect(document.documentElement.classList.contains("light")).toBe(false);
		expect(fakeWindow.localStorage.data.get(storageKey)).toBe("light");

		isDark.value = true;

		expect(isDark.value).toBe(true);
		expect(document.documentElement.classList.contains("dark")).toBe(true);
		expect(fakeWindow.localStorage.data.get(storageKey)).toBe("dark");

		isDark.value = false;

		expect(isDark.value).toBe(false);
		expect(document.documentElement.classList.contains("dark")).toBe(false);
		expect(document.documentElement.classList.contains("light")).toBe(false);
		expect(fakeWindow.localStorage.data.get(storageKey)).toBe("auto");

		isDark.stop();
	});

	it("stores auto when the requested value matches the system mode", () => {
		const fakeWindow = new FakeWindow();
		fakeWindow.setQuery(darkQuery, true);
		const isDark = useDark({
			document,
			initialValue: "light",
			window: fakeWindow,
		});

		isDark.value = true;

		expect(isDark.value).toBe(true);
		expect(fakeWindow.localStorage.data.get(storageKey)).toBe("auto");
		expect(document.documentElement.classList.contains("dark")).toBe(true);

		isDark.value = false;

		expect(isDark.value).toBe(false);
		expect(fakeWindow.localStorage.data.get(storageKey)).toBe("light");
		expect(document.documentElement.classList.contains("dark")).toBe(false);

		isDark.stop();
	});

	it("tracks system preference while auto is selected", () => {
		const fakeWindow = new FakeWindow();
		fakeWindow.setQuery(darkQuery, false);
		const isDark = useDark({
			document,
			window: fakeWindow,
		});

		expect(isDark.value).toBe(false);

		fakeWindow.dispatchQuery(darkQuery, true);

		expect(isDark.value).toBe(true);
		expect(document.documentElement.classList.contains("dark")).toBe(true);

		isDark.stop();
	});

	it("forwards selector and attribute options", () => {
		const fakeWindow = new FakeWindow();
		fakeWindow.setQuery(darkQuery, false);
		const isDark = useDark({
			attribute: "data-theme",
			document,
			initialValue: "light",
			selector: "body",
			valueDark: "theme-dark",
			valueLight: "theme-light",
			window: fakeWindow,
		});

		expect(document.documentElement.getAttribute("data-theme")).toBeNull();
		expect(document.body.getAttribute("data-theme")).toBe("theme-light");

		isDark.value = true;

		expect(document.documentElement.getAttribute("data-theme")).toBeNull();
		expect(document.body.getAttribute("data-theme")).toBe("theme-dark");

		isDark.stop();
	});

	it("uses custom DOM values and custom change handlers", () => {
		const fakeWindow = new FakeWindow();
		fakeWindow.setQuery(darkQuery, false);
		const onChanged = vi.fn((isDark, defaultHandler, mode) => {
			defaultHandler(mode);
		});
		const isDark = useDark({
			document,
			initialValue: "light",
			onChanged,
			valueDark: signal("theme-dark"),
			valueLight: signal("theme-light"),
			window: fakeWindow,
		});

		expect(isDark.value).toBe(false);
		expect(document.documentElement.classList.contains("theme-light")).toBe(
			true,
		);

		isDark.value = true;

		expect(onChanged).toHaveBeenLastCalledWith(
			true,
			expect.any(Function),
			"dark",
		);
		expect(document.documentElement.classList.contains("theme-dark")).toBe(
			true,
		);
		expect(document.documentElement.classList.contains("theme-light")).toBe(
			false,
		);

		isDark.stop();
	});

	it("lets custom change handlers replace DOM updates", () => {
		const fakeWindow = new FakeWindow();
		fakeWindow.setQuery(darkQuery, false);
		const onChanged = vi.fn();
		const isDark = useDark({
			document,
			initialValue: "light",
			onChanged,
			window: fakeWindow,
		});

		isDark.value = true;

		expect(onChanged).toHaveBeenLastCalledWith(
			true,
			expect.any(Function),
			"dark",
		);
		expect(document.documentElement.className).toBe("");

		isDark.stop();
	});

	it("forwards storage options", () => {
		const fakeWindow = new FakeWindow();
		fakeWindow.setQuery(darkQuery, false);
		const persisted = useDark({
			document,
			initialValue: "light",
			storageKey: "theme",
			window: fakeWindow,
		});

		persisted.value = true;

		expect(fakeWindow.localStorage.data.get("theme")).toBe("dark");
		expect(fakeWindow.localStorage.data.has(storageKey)).toBe(false);

		persisted.stop();
		fakeWindow.localStorage.data.clear();

		const temporary = useDark({
			document,
			initialValue: "light",
			storageKey: null,
			window: fakeWindow,
		});

		temporary.value = true;

		expect(fakeWindow.localStorage.data.size).toBe(0);

		temporary.stop();
	});

	it("stops DOM syncing", () => {
		const fakeWindow = new FakeWindow();
		fakeWindow.setQuery(darkQuery, false);
		const isDark = useDark({
			document,
			initialValue: "light",
			window: fakeWindow,
		});

		isDark.stop();
		isDark.value = true;

		expect(isDark.value).toBe(true);
		expect(document.documentElement.classList.contains("dark")).toBe(false);
	});

	it("stops system preference tracking", () => {
		const fakeWindow = new FakeWindow();
		fakeWindow.setQuery(darkQuery, false);
		const isDark = useDark({
			document,
			window: fakeWindow,
		});

		isDark.stop();
		fakeWindow.dispatchQuery(darkQuery, true);

		expect(isDark.value).toBe(false);
		expect(document.documentElement.classList.contains("dark")).toBe(false);
	});

	it("creates without a browser window", () => {
		const isDark = useDark({
			document: null,
			initialValue: "dark",
			window: null,
		});

		expect(isDark.value).toBe(true);

		isDark.stop();
	});
});
