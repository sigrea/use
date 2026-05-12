import { disposeTrackedMolecules } from "@sigrea/core";
import { afterEach, describe, expect, it } from "vitest";

import type { MatchMediaWindow } from "../types";
import { usePreferredColorScheme } from "./index";

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
	) {
		this.addEventListener("change", listener as EventListener);
	}

	removeListener(
		listener: (this: MediaQueryList, ev: MediaQueryListEvent) => void,
	) {
		this.removeEventListener("change", listener as EventListener);
	}

	dispatchMatch(matches: boolean) {
		this.matches = matches;
		const event = new Event("change");
		this.dispatchEvent(event);
		this.onchange?.call(this, event as MediaQueryListEvent);
	}
}

class FakeWindow implements MatchMediaWindow {
	readonly queries = new Map<string, FakeMediaQueryList>();

	setQuery(query: string, matches: boolean) {
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

	dispatchQuery(query: string, matches: boolean) {
		const queryList = this.queries.get(query);
		if (queryList === undefined) {
			throw new Error(`Unknown media query: ${query}`);
		}

		queryList.dispatchMatch(matches);
	}
}

describe("usePreferredColorScheme", () => {
	afterEach(() => {
		disposeTrackedMolecules();
	});

	it("prefers dark when the dark query matches", () => {
		const fakeWindow = new FakeWindow();
		fakeWindow.setQuery("(prefers-color-scheme: dark)", true);
		fakeWindow.setQuery("(prefers-color-scheme: light)", true);
		const colorScheme = usePreferredColorScheme({
			window: fakeWindow,
		});

		expect(colorScheme.value).toBe("dark");

		colorScheme.stop();
	});

	it("uses light when the light query matches", () => {
		const fakeWindow = new FakeWindow();
		fakeWindow.setQuery("(prefers-color-scheme: dark)", false);
		fakeWindow.setQuery("(prefers-color-scheme: light)", true);
		const colorScheme = usePreferredColorScheme({
			window: fakeWindow,
		});

		expect(colorScheme.value).toBe("light");

		colorScheme.stop();
	});

	it("returns no-preference when neither color query matches", () => {
		const fakeWindow = new FakeWindow();
		fakeWindow.setQuery("(prefers-color-scheme: dark)", false);
		fakeWindow.setQuery("(prefers-color-scheme: light)", false);
		const colorScheme = usePreferredColorScheme({
			window: fakeWindow,
		});

		expect(colorScheme.value).toBe("no-preference");

		colorScheme.stop();
	});

	it("tracks media query changes", () => {
		const fakeWindow = new FakeWindow();
		fakeWindow.setQuery("(prefers-color-scheme: dark)", false);
		fakeWindow.setQuery("(prefers-color-scheme: light)", true);
		const colorScheme = usePreferredColorScheme({
			window: fakeWindow,
		});

		expect(colorScheme.value).toBe("light");

		fakeWindow.dispatchQuery("(prefers-color-scheme: light)", false);
		fakeWindow.dispatchQuery("(prefers-color-scheme: dark)", true);
		expect(colorScheme.value).toBe("dark");

		fakeWindow.dispatchQuery("(prefers-color-scheme: dark)", false);
		fakeWindow.dispatchQuery("(prefers-color-scheme: light)", false);
		expect(colorScheme.value).toBe("no-preference");

		fakeWindow.dispatchQuery("(prefers-color-scheme: light)", true);
		expect(colorScheme.value).toBe("light");

		colorScheme.stop();
	});

	it("stops both media query watchers", () => {
		const fakeWindow = new FakeWindow();
		fakeWindow.setQuery("(prefers-color-scheme: dark)", false);
		fakeWindow.setQuery("(prefers-color-scheme: light)", true);
		const colorScheme = usePreferredColorScheme({
			window: fakeWindow,
		});

		colorScheme.stop();
		fakeWindow.dispatchQuery("(prefers-color-scheme: light)", false);
		fakeWindow.dispatchQuery("(prefers-color-scheme: dark)", true);

		expect(colorScheme.value).toBe("light");
	});

	it("uses no-preference when window is null", () => {
		const colorScheme = usePreferredColorScheme({
			window: null,
		});

		expect(colorScheme.value).toBe("no-preference");

		colorScheme.stop();
	});
});
