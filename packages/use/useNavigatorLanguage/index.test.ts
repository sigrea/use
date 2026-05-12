import { disposeTrackedMolecules, signal } from "@sigrea/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { UseNavigatorLanguageNavigatorLike, WindowLike } from "../types";
import { useNavigatorLanguage } from "./index";

class FakeNavigator implements UseNavigatorLanguageNavigatorLike {
	constructor(public language?: string) {}
}

class FakeWindow extends EventTarget implements WindowLike {
	readonly navigator: FakeNavigator;

	constructor(language?: string) {
		super();
		this.navigator = new FakeNavigator(language);
	}

	dispatchLanguageChange(language?: string): void {
		this.navigator.language = language;
		this.dispatchEvent(new Event("languagechange"));
	}
}

describe("useNavigatorLanguage", () => {
	afterEach(() => {
		disposeTrackedMolecules();
	});

	it("reads navigator.language as the initial value", () => {
		const language = useNavigatorLanguage({
			window: new FakeWindow("en-US"),
		});

		expect(language.isSupported.value).toBe(true);
		expect(language.language.value).toBe("en-US");

		language.stop();
	});

	it("tracks languagechange events", () => {
		const fakeWindow = new FakeWindow("en-US");
		const language = useNavigatorLanguage({ window: fakeWindow });

		fakeWindow.dispatchLanguageChange("ja-JP");

		expect(language.language.value).toBe("ja-JP");
		expect(language.isSupported.value).toBe(true);

		language.stop();
		fakeWindow.dispatchLanguageChange("fr-FR");
		expect(language.language.value).toBe("ja-JP");
	});

	it("reports unsupported when navigator is unavailable", () => {
		const language = useNavigatorLanguage({
			navigator: null,
			window: null,
		});

		expect(language.isSupported.value).toBe(false);
		expect(language.language.value).toBeUndefined();

		language.stop();
	});

	it("reports support when the language property exists without a value", () => {
		const language = useNavigatorLanguage({
			navigator: { language: undefined },
			window: null,
		});

		expect(language.isSupported.value).toBe(true);
		expect(language.language.value).toBeUndefined();

		language.stop();
	});

	it("does not fall back to window.navigator when navigator is null", () => {
		const fakeWindow = new FakeWindow("en-US");
		const language = useNavigatorLanguage({
			navigator: null,
			window: fakeWindow,
		});

		expect(language.isSupported.value).toBe(false);
		expect(language.language.value).toBeUndefined();

		fakeWindow.dispatchLanguageChange("ja-JP");
		expect(language.language.value).toBeUndefined();

		language.stop();
	});

	it("falls back to window.navigator while reactive navigator is undefined", () => {
		const fakeWindow = new FakeWindow("en-US");
		const navigator = signal<
			UseNavigatorLanguageNavigatorLike | null | undefined
		>(undefined);
		const language = useNavigatorLanguage({
			navigator,
			window: fakeWindow,
		});

		expect(language.language.value).toBe("en-US");

		navigator.value = new FakeNavigator("ja-JP");
		expect(language.language.value).toBe("ja-JP");

		navigator.value = undefined;
		expect(language.language.value).toBe("en-US");

		language.stop();
	});

	it("accepts a navigator separate from the event window", () => {
		const fakeWindow = new FakeWindow("en-US");
		const fakeNavigator = new FakeNavigator("fr-FR");
		const language = useNavigatorLanguage({
			navigator: fakeNavigator,
			window: fakeWindow,
		});

		expect(language.language.value).toBe("fr-FR");

		fakeNavigator.language = "de-DE";
		fakeWindow.dispatchEvent(new Event("languagechange"));
		expect(language.language.value).toBe("de-DE");

		language.stop();
	});

	it("retargets listeners when the window changes", () => {
		const firstWindow = new FakeWindow("en-US");
		const secondWindow = new FakeWindow("ja-JP");
		const windowTarget = signal<WindowLike | null>(firstWindow);
		const language = useNavigatorLanguage({
			window: windowTarget,
		});

		expect(language.language.value).toBe("en-US");

		windowTarget.value = secondWindow;
		expect(language.language.value).toBe("ja-JP");

		firstWindow.dispatchLanguageChange("fr-FR");
		expect(language.language.value).toBe("ja-JP");

		secondWindow.dispatchLanguageChange("de-DE");
		expect(language.language.value).toBe("de-DE");

		windowTarget.value = null;
		expect(language.isSupported.value).toBe(false);
		expect(language.language.value).toBeUndefined();

		secondWindow.dispatchLanguageChange("it-IT");
		expect(language.language.value).toBeUndefined();

		language.stop();
	});

	it("does not fall back to the default window when window is null", () => {
		const addSpy = vi.spyOn(window, "addEventListener");
		const language = useNavigatorLanguage({ window: null });

		expect(addSpy).not.toHaveBeenCalled();
		expect(language.isSupported.value).toBe(false);
		expect(language.language.value).toBeUndefined();

		language.stop();
		addSpy.mockRestore();
	});
});
