import { disposeTrackedMolecules } from "@sigrea/core";
import { afterEach, describe, expect, it } from "vitest";

import type { MatchMediaWindow } from "../types";
import { usePreferredReducedMotion } from "./index";

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

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";

describe("usePreferredReducedMotion", () => {
	afterEach(() => {
		disposeTrackedMolecules();
	});

	it("returns reduce when the reduce query matches", () => {
		const fakeWindow = new FakeWindow();
		fakeWindow.setQuery(reducedMotionQuery, true);
		const preferredReducedMotion = usePreferredReducedMotion({
			window: fakeWindow,
		});

		expect(preferredReducedMotion.value).toBe("reduce");

		preferredReducedMotion.stop();
	});

	it("falls back to no-preference when the reduce query does not match", () => {
		const fakeWindow = new FakeWindow();
		fakeWindow.setQuery(reducedMotionQuery, false);
		const preferredReducedMotion = usePreferredReducedMotion({
			window: fakeWindow,
		});

		expect(preferredReducedMotion.value).toBe("no-preference");

		preferredReducedMotion.stop();
	});

	it("tracks media query changes", () => {
		const fakeWindow = new FakeWindow();
		fakeWindow.setQuery(reducedMotionQuery, false);
		const preferredReducedMotion = usePreferredReducedMotion({
			window: fakeWindow,
		});

		expect(preferredReducedMotion.value).toBe("no-preference");

		fakeWindow.dispatchQuery(reducedMotionQuery, true);
		expect(preferredReducedMotion.value).toBe("reduce");

		fakeWindow.dispatchQuery(reducedMotionQuery, false);
		expect(preferredReducedMotion.value).toBe("no-preference");

		preferredReducedMotion.stop();
	});

	it("stops the media query watcher", () => {
		const fakeWindow = new FakeWindow();
		fakeWindow.setQuery(reducedMotionQuery, false);
		const preferredReducedMotion = usePreferredReducedMotion({
			window: fakeWindow,
		});

		preferredReducedMotion.stop();
		fakeWindow.dispatchQuery(reducedMotionQuery, true);

		expect(preferredReducedMotion.value).toBe("no-preference");
	});

	it("uses no-preference when window is null", () => {
		const preferredReducedMotion = usePreferredReducedMotion({
			window: null,
		});

		expect(preferredReducedMotion.value).toBe("no-preference");

		preferredReducedMotion.stop();
	});
});
