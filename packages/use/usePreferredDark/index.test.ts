import { disposeTrackedMolecules } from "@sigrea/core";
import { afterEach, describe, expect, it } from "vitest";

import type { MatchMediaWindow } from "../types";
import { usePreferredDark } from "./index";

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

describe("usePreferredDark", () => {
	afterEach(() => {
		disposeTrackedMolecules();
	});

	it("wraps the dark color scheme media query", () => {
		const fakeWindow = new FakeWindow();
		fakeWindow.setQuery("(prefers-color-scheme: dark)", true);
		const preferredDark = usePreferredDark({
			window: fakeWindow,
		});

		expect(preferredDark.matches.value).toBe(true);

		preferredDark.stop();
	});

	it("tracks media query changes", () => {
		const fakeWindow = new FakeWindow();
		fakeWindow.setQuery("(prefers-color-scheme: dark)", false);
		const preferredDark = usePreferredDark({
			window: fakeWindow,
		});

		fakeWindow.dispatchQuery("(prefers-color-scheme: dark)", true);
		expect(preferredDark.matches.value).toBe(true);

		preferredDark.stop();
		fakeWindow.dispatchQuery("(prefers-color-scheme: dark)", false);
		expect(preferredDark.matches.value).toBe(true);
	});

	it("uses useMediaQuery fallback options for SSR", () => {
		const preferredDark = usePreferredDark({
			initialValue: true,
			window: null,
		});

		expect(preferredDark.matches.value).toBe(true);

		preferredDark.stop();
	});
});
