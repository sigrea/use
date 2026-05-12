import { disposeTrackedMolecules, signal } from "@sigrea/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { UsePreferredLanguagesNavigatorLike, WindowLike } from "../types";
import { usePreferredLanguages } from "./index";

class FakeNavigator implements UsePreferredLanguagesNavigatorLike {
	constructor(public languages?: readonly string[]) {}
}

class FakeWindow extends EventTarget implements WindowLike {
	readonly navigator: FakeNavigator;

	constructor(languages?: readonly string[]) {
		super();
		this.navigator = new FakeNavigator(languages);
	}

	dispatchLanguageChange(languages?: readonly string[]): void {
		this.navigator.languages = languages;
		this.dispatchEvent(new Event("languagechange"));
	}
}

describe("usePreferredLanguages", () => {
	afterEach(() => {
		disposeTrackedMolecules();
	});

	it("reads navigator.languages as the initial value", () => {
		const preferred = usePreferredLanguages({
			window: new FakeWindow(["en-US", "en"]),
		});

		expect(preferred.isSupported.value).toBe(true);
		expect(preferred.languages.value).toEqual(["en-US", "en"]);

		preferred.stop();
	});

	it("tracks languagechange events", () => {
		const fakeWindow = new FakeWindow(["en-US", "en"]);
		const preferred = usePreferredLanguages({ window: fakeWindow });

		fakeWindow.dispatchLanguageChange(["ja-JP", "ja"]);

		expect(preferred.languages.value).toEqual(["ja-JP", "ja"]);
		expect(preferred.isSupported.value).toBe(true);

		preferred.stop();
		fakeWindow.dispatchLanguageChange(["fr-FR"]);
		expect(preferred.languages.value).toEqual(["ja-JP", "ja"]);
	});

	it("reports unsupported when navigator is unavailable", () => {
		const preferred = usePreferredLanguages({
			navigator: null,
			window: null,
		});

		expect(preferred.isSupported.value).toBe(false);
		expect(preferred.languages.value).toEqual([]);

		preferred.stop();
	});

	it("reports unsupported when the languages property is missing", () => {
		const preferred = usePreferredLanguages({
			navigator: {},
			window: null,
		});

		expect(preferred.isSupported.value).toBe(false);
		expect(preferred.languages.value).toEqual([]);

		preferred.stop();
	});

	it("reports support when the languages property exists with an empty value", () => {
		const preferred = usePreferredLanguages({
			navigator: { languages: [] },
			window: null,
		});

		expect(preferred.isSupported.value).toBe(true);
		expect(preferred.languages.value).toEqual([]);

		preferred.stop();
	});

	it("reports support when the languages property exists without a value", () => {
		const preferred = usePreferredLanguages({
			navigator: { languages: undefined },
			window: null,
		});

		expect(preferred.isSupported.value).toBe(true);
		expect(preferred.languages.value).toEqual([]);

		preferred.stop();
	});

	it("does not fall back to window.navigator when navigator is null", () => {
		const fakeWindow = new FakeWindow(["en-US"]);
		const preferred = usePreferredLanguages({
			navigator: null,
			window: fakeWindow,
		});

		expect(preferred.isSupported.value).toBe(false);
		expect(preferred.languages.value).toEqual([]);

		fakeWindow.dispatchLanguageChange(["ja-JP"]);
		expect(preferred.languages.value).toEqual([]);

		preferred.stop();
	});

	it("falls back to window.navigator while reactive navigator is undefined", () => {
		const fakeWindow = new FakeWindow(["en-US"]);
		const navigator = signal<
			UsePreferredLanguagesNavigatorLike | null | undefined
		>(undefined);
		const preferred = usePreferredLanguages({
			navigator,
			window: fakeWindow,
		});

		expect(preferred.languages.value).toEqual(["en-US"]);

		navigator.value = new FakeNavigator(["ja-JP"]);
		expect(preferred.languages.value).toEqual(["ja-JP"]);

		navigator.value = undefined;
		expect(preferred.languages.value).toEqual(["en-US"]);

		preferred.stop();
	});

	it("accepts a navigator separate from the event window", () => {
		const fakeWindow = new FakeWindow(["en-US"]);
		const fakeNavigator = new FakeNavigator(["fr-FR"]);
		const preferred = usePreferredLanguages({
			navigator: fakeNavigator,
			window: fakeWindow,
		});

		expect(preferred.languages.value).toEqual(["fr-FR"]);

		fakeNavigator.languages = ["de-DE"];
		fakeWindow.dispatchEvent(new Event("languagechange"));
		expect(preferred.languages.value).toEqual(["de-DE"]);

		preferred.stop();
	});

	it("retargets listeners when the window changes", () => {
		const firstWindow = new FakeWindow(["en-US"]);
		const secondWindow = new FakeWindow(["ja-JP"]);
		const windowTarget = signal<WindowLike | null>(firstWindow);
		const preferred = usePreferredLanguages({
			window: windowTarget,
		});

		expect(preferred.languages.value).toEqual(["en-US"]);

		windowTarget.value = secondWindow;
		expect(preferred.languages.value).toEqual(["ja-JP"]);

		firstWindow.dispatchLanguageChange(["fr-FR"]);
		expect(preferred.languages.value).toEqual(["ja-JP"]);

		secondWindow.dispatchLanguageChange(["de-DE"]);
		expect(preferred.languages.value).toEqual(["de-DE"]);

		windowTarget.value = null;
		expect(preferred.isSupported.value).toBe(false);
		expect(preferred.languages.value).toEqual([]);

		secondWindow.dispatchLanguageChange(["it-IT"]);
		expect(preferred.languages.value).toEqual([]);

		preferred.stop();
	});

	it("does not fall back to the default window when window is null", () => {
		const addSpy = vi.spyOn(window, "addEventListener");
		const preferred = usePreferredLanguages({ window: null });

		expect(addSpy).not.toHaveBeenCalled();
		expect(preferred.isSupported.value).toBe(false);
		expect(preferred.languages.value).toEqual([]);

		preferred.stop();
		addSpy.mockRestore();
	});

	it("keeps a copied languages array", () => {
		const source = ["en-US", "en"];
		const preferred = usePreferredLanguages({
			navigator: { languages: source },
			window: null,
		});
		const initialValue = preferred.languages.value;

		source.push("ja-JP");

		expect(preferred.languages.value).toEqual(["en-US", "en"]);
		expect(preferred.languages.value).toBe(initialValue);

		preferred.stop();
	});
});
