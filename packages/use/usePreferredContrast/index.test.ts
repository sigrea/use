import { disposeTrackedMolecules } from "@sigrea/core";
import { afterEach, describe, expect, it } from "vitest";

import type { MatchMediaWindow } from "../types";
import { usePreferredContrast } from "./index";

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

const moreQuery = "(prefers-contrast: more)";
const lessQuery = "(prefers-contrast: less)";
const customQuery = "(prefers-contrast: custom)";

function createWindow(matches: {
	more?: boolean;
	less?: boolean;
	custom?: boolean;
}): FakeWindow {
	const fakeWindow = new FakeWindow();
	fakeWindow.setQuery(moreQuery, matches.more ?? false);
	fakeWindow.setQuery(lessQuery, matches.less ?? false);
	fakeWindow.setQuery(customQuery, matches.custom ?? false);

	return fakeWindow;
}

describe("usePreferredContrast", () => {
	afterEach(() => {
		disposeTrackedMolecules();
	});

	it("returns more when the more query matches", () => {
		const preferredContrast = usePreferredContrast({
			window: createWindow({ more: true }),
		});

		expect(preferredContrast.value).toBe("more");

		preferredContrast.stop();
	});

	it("returns less when the less query matches", () => {
		const preferredContrast = usePreferredContrast({
			window: createWindow({ less: true }),
		});

		expect(preferredContrast.value).toBe("less");

		preferredContrast.stop();
	});

	it("returns custom when the custom query matches", () => {
		const preferredContrast = usePreferredContrast({
			window: createWindow({ custom: true }),
		});

		expect(preferredContrast.value).toBe("custom");

		preferredContrast.stop();
	});

	it("falls back to no-preference when no query matches", () => {
		const preferredContrast = usePreferredContrast({
			window: createWindow({}),
		});

		expect(preferredContrast.value).toBe("no-preference");

		preferredContrast.stop();
	});

	it("prefers more before less and custom", () => {
		const preferredContrast = usePreferredContrast({
			window: createWindow({ more: true, less: true, custom: true }),
		});

		expect(preferredContrast.value).toBe("more");

		preferredContrast.stop();
	});

	it("prefers less before custom", () => {
		const preferredContrast = usePreferredContrast({
			window: createWindow({ less: true, custom: true }),
		});

		expect(preferredContrast.value).toBe("less");

		preferredContrast.stop();
	});

	it("tracks media query changes", () => {
		const fakeWindow = createWindow({});
		const preferredContrast = usePreferredContrast({
			window: fakeWindow,
		});

		expect(preferredContrast.value).toBe("no-preference");

		fakeWindow.dispatchQuery(customQuery, true);
		expect(preferredContrast.value).toBe("custom");

		fakeWindow.dispatchQuery(lessQuery, true);
		expect(preferredContrast.value).toBe("less");

		fakeWindow.dispatchQuery(moreQuery, true);
		expect(preferredContrast.value).toBe("more");

		fakeWindow.dispatchQuery(moreQuery, false);
		expect(preferredContrast.value).toBe("less");

		fakeWindow.dispatchQuery(lessQuery, false);
		fakeWindow.dispatchQuery(customQuery, false);
		expect(preferredContrast.value).toBe("no-preference");

		preferredContrast.stop();
	});

	it("stops all media query watchers", () => {
		const fakeWindow = createWindow({ custom: true });
		const preferredContrast = usePreferredContrast({
			window: fakeWindow,
		});

		preferredContrast.stop();
		fakeWindow.dispatchQuery(moreQuery, true);
		fakeWindow.dispatchQuery(lessQuery, true);
		fakeWindow.dispatchQuery(customQuery, false);

		expect(preferredContrast.value).toBe("custom");
	});

	it("uses no-preference when window is null", () => {
		const preferredContrast = usePreferredContrast({
			window: null,
		});

		expect(preferredContrast.value).toBe("no-preference");

		preferredContrast.stop();
	});
});
