import { createScope, disposeScope, runWithScope, signal } from "@sigrea/core";
import { describe, expect, it } from "vitest";

import { watchMediaQuery } from "../watchMediaQuery";

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
		Object.defineProperties(event, {
			matches: {
				value: matches,
			},
			media: {
				value: this.media,
			},
		});
		this.dispatchEvent(event);
		this.onchange?.call(this, event as MediaQueryListEvent);
	}
}

class FakeWindow {
	private readonly queries = new Map<string, FakeMediaQueryList>();

	setQuery(query: string, matches: boolean) {
		this.queries.set(query, new FakeMediaQueryList(query, matches));
	}

	matchMedia(query: string): MediaQueryList {
		let queryList = this.queries.get(query);
		if (queryList === undefined) {
			queryList = new FakeMediaQueryList(query, false);
			this.queries.set(query, queryList);
		}
		return queryList as MediaQueryList;
	}

	dispatch(query: string, matches: boolean) {
		const queryList = this.queries.get(query);
		if (queryList === undefined) {
			throw new Error(`Unknown media query: ${query}`);
		}
		queryList.dispatchMatch(matches);
	}
}

describe("watchMediaQuery", () => {
	it("emits the initial match state and subsequent changes", () => {
		const fakeWindow = new FakeWindow();
		fakeWindow.setQuery("(min-width: 640px)", true);
		const seen: boolean[] = [];

		const stop = watchMediaQuery(
			"(min-width: 640px)",
			(matches) => {
				seen.push(matches);
			},
			{ window: fakeWindow },
		);

		expect(seen).toEqual([true]);

		fakeWindow.dispatch("(min-width: 640px)", false);
		expect(seen).toEqual([true, false]);

		stop();
		fakeWindow.dispatch("(min-width: 640px)", true);
		expect(seen).toEqual([true, false]);
	});

	it("rebinds when the query signal changes", () => {
		const fakeWindow = new FakeWindow();
		fakeWindow.setQuery("(min-width: 640px)", false);
		fakeWindow.setQuery("(prefers-reduced-motion: reduce)", true);
		const query = signal("(min-width: 640px)");
		const seen: Array<{ media: string; matches: boolean }> = [];

		const stop = watchMediaQuery(
			query,
			(matches, queryList) => {
				seen.push({ media: queryList.media, matches });
			},
			{ window: fakeWindow },
		);

		query.value = "(prefers-reduced-motion: reduce)";
		fakeWindow.dispatch("(min-width: 640px)", true);
		fakeWindow.dispatch("(prefers-reduced-motion: reduce)", false);

		expect(seen).toEqual([
			{ media: "(min-width: 640px)", matches: false },
			{ media: "(prefers-reduced-motion: reduce)", matches: true },
			{ media: "(prefers-reduced-motion: reduce)", matches: false },
		]);

		stop();
	});

	it("rebinds when the window getter changes and cleans up the previous query", () => {
		const firstWindow = new FakeWindow();
		const secondWindow = new FakeWindow();
		firstWindow.setQuery("(min-width: 640px)", false);
		secondWindow.setQuery("(min-width: 640px)", true);
		const currentWindow = signal<FakeWindow | undefined>(firstWindow);
		const seen: boolean[] = [];

		const stop = watchMediaQuery(
			"(min-width: 640px)",
			(matches) => {
				seen.push(matches);
			},
			{ window: () => currentWindow.value },
		);

		expect(seen).toEqual([false]);

		currentWindow.value = secondWindow;
		firstWindow.dispatch("(min-width: 640px)", true);
		secondWindow.dispatch("(min-width: 640px)", false);

		expect(seen).toEqual([false, true, false]);

		currentWindow.value = undefined;
		secondWindow.dispatch("(min-width: 640px)", true);

		expect(seen).toEqual([false, true, false]);
		stop();
	});

	it("does nothing when no window is available", () => {
		const seen: boolean[] = [];

		const stop = watchMediaQuery("(min-width: 640px)", (matches) => {
			seen.push(matches);
		});

		expect(seen).toEqual([]);
		stop();
	});

	it("supports an explicit undefined window target", () => {
		const seen: boolean[] = [];

		const stop = watchMediaQuery(
			"(min-width: 640px)",
			(matches) => {
				seen.push(matches);
			},
			{ window: undefined },
		);

		expect(seen).toEqual([]);
		stop();
	});

	it("cleans up with the active scope", () => {
		const fakeWindow = new FakeWindow();
		fakeWindow.setQuery("(prefers-reduced-motion: reduce)", false);
		const seen: boolean[] = [];
		const scope = createScope();

		runWithScope(scope, () => {
			watchMediaQuery(
				"(prefers-reduced-motion: reduce)",
				(matches) => {
					seen.push(matches);
				},
				{ window: fakeWindow },
			);
		});

		expect(seen).toEqual([false]);

		disposeScope(scope);
		fakeWindow.dispatch("(prefers-reduced-motion: reduce)", true);

		expect(seen).toEqual([false]);
	});
});
