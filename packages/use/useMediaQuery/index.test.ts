import {
	disposeTrackedMolecules,
	molecule,
	mountMolecule,
	signal,
	trackMolecule,
} from "@sigrea/core";
import { afterEach, describe, expect, it } from "vitest";

import { useMediaQuery } from "./index";

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

	dispatchQuery(query: string, matches: boolean) {
		const queryList = this.queries.get(query);
		if (queryList === undefined) {
			throw new Error(`Unknown media query: ${query}`);
		}
		queryList.dispatchMatch(matches);
	}
}

describe("useMediaQuery", () => {
	afterEach(() => {
		disposeTrackedMolecules();
	});

	it("tracks media query changes", () => {
		const fakeWindow = new FakeWindow();
		fakeWindow.setQuery("(min-width: 768px)", false);
		const query = signal("(min-width: 768px)");
		const mediaQuery = useMediaQuery(query, {
			window: fakeWindow,
		});

		expect(mediaQuery.matches.value).toBe(false);

		fakeWindow.dispatchQuery("(min-width: 768px)", true);
		expect(mediaQuery.matches.value).toBe(true);

		mediaQuery.stop();
		fakeWindow.dispatchQuery("(min-width: 768px)", false);
		expect(mediaQuery.matches.value).toBe(true);
	});

	it("reads the current media query state before molecule mount", () => {
		const fakeWindow = new FakeWindow();
		fakeWindow.setQuery("(min-width: 768px)", true);
		const MediaQueryMolecule = molecule(() =>
			useMediaQuery("(min-width: 768px)", {
				window: fakeWindow,
			}),
		);
		const instance = MediaQueryMolecule();
		trackMolecule(instance);

		expect(instance.matches.value).toBe(true);

		mountMolecule(instance);
		fakeWindow.dispatchQuery("(min-width: 768px)", false);
		expect(instance.matches.value).toBe(false);
	});

	it("retargets media query listeners when the window changes", () => {
		const firstWindow = new FakeWindow();
		firstWindow.setQuery("(min-width: 768px)", false);
		const secondWindow = new FakeWindow();
		secondWindow.setQuery("(min-width: 768px)", true);
		const currentWindow = signal<FakeWindow | null>(firstWindow);
		const mediaQuery = useMediaQuery("(min-width: 768px)", {
			window: currentWindow,
		});

		expect(mediaQuery.matches.value).toBe(false);

		currentWindow.value = secondWindow;
		expect(mediaQuery.matches.value).toBe(true);

		firstWindow.dispatchQuery("(min-width: 768px)", true);
		expect(mediaQuery.matches.value).toBe(true);

		secondWindow.dispatchQuery("(min-width: 768px)", false);
		expect(mediaQuery.matches.value).toBe(false);
	});

	it("falls back to the initial media query value when the window disappears", () => {
		const firstWindow = new FakeWindow();
		firstWindow.setQuery("(min-width: 768px)", false);
		const currentWindow = signal<FakeWindow | null>(firstWindow);
		const mediaQuery = useMediaQuery("(min-width: 768px)", {
			initialValue: true,
			window: currentWindow,
		});

		expect(mediaQuery.matches.value).toBe(false);

		currentWindow.value = null;
		expect(mediaQuery.matches.value).toBe(true);

		firstWindow.dispatchQuery("(min-width: 768px)", true);
		expect(mediaQuery.matches.value).toBe(true);
	});

	it("evaluates width media queries with ssrWidth when matchMedia is unavailable", () => {
		const query = signal("(min-width: 500px)");
		const mediaQuery = useMediaQuery(query, {
			ssrWidth: 500,
			window: null,
		});

		expect(mediaQuery.matches.value).toBe(true);

		query.value = "(min-width: 501px)";
		expect(mediaQuery.matches.value).toBe(false);

		query.value = "(min-width: 500px) and (max-width: 37rem)";
		expect(mediaQuery.matches.value).toBe(true);

		query.value = "(max-width: 31rem)";
		expect(mediaQuery.matches.value).toBe(false);

		query.value = "(max-width: 31rem), (min-width: 400px)";
		expect(mediaQuery.matches.value).toBe(true);

		query.value = "(max-width: 31rem), not all and (min-width: 400px)";
		expect(mediaQuery.matches.value).toBe(false);

		query.value = "not all (max-width: 100px) and (min-width: 1000px)";
		expect(mediaQuery.matches.value).toBe(true);
	});

	it("evaluates calc width media queries with ssrWidth", () => {
		const belowMax = useMediaQuery("(max-width: calc(64rem - 0.1px))", {
			ssrWidth: 1023,
			window: null,
		});
		const atMax = useMediaQuery("(max-width: calc(64rem - 0.1px))", {
			ssrWidth: 1024,
			window: null,
		});
		const aboveMin = useMediaQuery("(min-width: calc(48rem + 0.1px))", {
			ssrWidth: 769,
			window: null,
		});
		const atMin = useMediaQuery("(min-width: calc(48rem + 0.1px))", {
			ssrWidth: 768,
			window: null,
		});

		expect(belowMax.matches.value).toBe(true);
		expect(atMax.matches.value).toBe(false);
		expect(aboveMin.matches.value).toBe(true);
		expect(atMin.matches.value).toBe(false);

		belowMax.stop();
		atMax.stop();
		aboveMin.stop();
		atMin.stop();
	});

	it("uses initialValue when ssrWidth cannot evaluate the query", () => {
		const mediaQuery = useMediaQuery("(prefers-reduced-motion: reduce)", {
			initialValue: true,
			ssrWidth: 1024,
			window: null,
		});

		expect(mediaQuery.matches.value).toBe(true);
	});

	it("keeps explicit null window targets on ssrWidth fallback", () => {
		const originalMatchMedia = window.matchMedia;
		Object.defineProperty(window, "matchMedia", {
			configurable: true,
			value: (query: string) => new FakeMediaQueryList(query, false),
		});
		try {
			const mediaQuery = useMediaQuery("(min-width: 1px)", {
				ssrWidth: 500,
				window: null,
			});

			expect(mediaQuery.matches.value).toBe(true);
		} finally {
			Object.defineProperty(window, "matchMedia", {
				configurable: true,
				value: originalMatchMedia,
			});
		}
	});

	it("uses the default window when window is explicitly undefined", () => {
		const originalMatchMedia = window.matchMedia;
		Object.defineProperty(window, "matchMedia", {
			configurable: true,
			value: (query: string) => new FakeMediaQueryList(query, false),
		});
		try {
			const mediaQuery = useMediaQuery("(min-width: 1px)", {
				ssrWidth: 500,
				window: undefined,
			});

			expect(mediaQuery.matches.value).toBe(false);
		} finally {
			Object.defineProperty(window, "matchMedia", {
				configurable: true,
				value: originalMatchMedia,
			});
		}
	});

	it("uses matchMedia before ssrWidth when a window is available", () => {
		const fakeWindow = new FakeWindow();
		fakeWindow.setQuery("(min-width: 1px)", false);
		const mediaQuery = useMediaQuery("(min-width: 1px)", {
			ssrWidth: 500,
			window: fakeWindow,
		});

		expect(mediaQuery.matches.value).toBe(false);
	});
});
