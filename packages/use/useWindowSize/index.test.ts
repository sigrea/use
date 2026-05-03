import {
	disposeTrackedMolecules,
	molecule,
	mountMolecule,
	signal,
	trackMolecule,
} from "@sigrea/core";
import { afterEach, describe, expect, it } from "vitest";

import { useWindowSize } from "./index";

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

class FakeDocument extends EventTarget {
	documentElement = {
		clientHeight: 720,
		clientWidth: 960,
	};
}

class FakeWindow extends EventTarget {
	document = new FakeDocument();
	innerWidth = 1024;
	innerHeight = 768;
	outerWidth = 1280;
	outerHeight = 960;
	visualViewport = new (class extends EventTarget {
		height = 540;
		scale = 2;
		width = 720;

		setSize(width: number, height: number, scale = this.scale) {
			this.width = width;
			this.height = height;
			this.scale = scale;
			this.dispatchEvent(new Event("resize"));
		}
	})();
	private readonly queries = new Map<string, FakeMediaQueryList>();

	setSize(width: number, height: number) {
		this.innerWidth = width;
		this.innerHeight = height;
		this.dispatchEvent(new Event("resize"));
	}

	setDocumentSize(width: number, height: number) {
		this.document.documentElement.clientWidth = width;
		this.document.documentElement.clientHeight = height;
	}

	setOuterSize(width: number, height: number) {
		this.outerWidth = width;
		this.outerHeight = height;
	}

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

describe("useWindowSize", () => {
	afterEach(() => {
		disposeTrackedMolecules();
	});

	it("tracks window size updates", () => {
		const fakeWindow = new FakeWindow();
		const size = useWindowSize({
			window: fakeWindow,
		});

		expect(size.width.value).toBe(1024);
		expect(size.height.value).toBe(768);

		fakeWindow.setSize(800, 600);
		expect(size.width.value).toBe(800);
		expect(size.height.value).toBe(600);

		size.stop();
		fakeWindow.setSize(640, 480);
		expect(size.width.value).toBe(800);
		expect(size.height.value).toBe(600);
	});

	it("can read the outer window size", () => {
		const fakeWindow = new FakeWindow();
		fakeWindow.setOuterSize(1600, 1000);
		const size = useWindowSize({
			type: "outer",
			window: fakeWindow,
		});

		expect(size.width.value).toBe(1600);
		expect(size.height.value).toBe(1000);
	});

	it("can exclude the scrollbar from the window size", () => {
		const fakeWindow = new FakeWindow();
		fakeWindow.setDocumentSize(980, 740);
		const size = useWindowSize({
			includeScrollbar: false,
			window: fakeWindow,
		});

		expect(size.width.value).toBe(980);
		expect(size.height.value).toBe(740);
	});

	it("can read the visual viewport size", () => {
		const fakeWindow = new FakeWindow();
		const size = useWindowSize({
			type: "visual",
			window: fakeWindow,
		});

		expect(size.width.value).toBe(1440);
		expect(size.height.value).toBe(1080);

		fakeWindow.visualViewport.setSize(500, 300, 1.5);
		expect(size.width.value).toBe(750);
		expect(size.height.value).toBe(450);
	});

	it("updates the window size when the orientation media query changes", () => {
		const fakeWindow = new FakeWindow();
		fakeWindow.setDocumentSize(980, 740);
		fakeWindow.setQuery("(orientation: portrait)", false);
		const size = useWindowSize({
			includeScrollbar: false,
			window: fakeWindow,
		});

		expect(size.width.value).toBe(980);
		expect(size.height.value).toBe(740);

		fakeWindow.setDocumentSize(720, 980);
		fakeWindow.dispatchQuery("(orientation: portrait)", true);

		expect(size.width.value).toBe(720);
		expect(size.height.value).toBe(980);
	});

	it("reads the current window size before molecule mount", () => {
		const fakeWindow = new FakeWindow();
		fakeWindow.setSize(1440, 900);
		const WindowSizeMolecule = molecule(() =>
			useWindowSize({
				window: fakeWindow,
			}),
		);
		const instance = WindowSizeMolecule();
		trackMolecule(instance);

		expect(instance.width.value).toBe(1440);
		expect(instance.height.value).toBe(900);

		mountMolecule(instance);
		fakeWindow.setSize(1200, 700);
		expect(instance.width.value).toBe(1200);
		expect(instance.height.value).toBe(700);
	});

	it("retargets window size listeners when the window changes", () => {
		const firstWindow = new FakeWindow();
		const secondWindow = new FakeWindow();
		secondWindow.setSize(1440, 900);
		const currentWindow = signal<FakeWindow | null>(firstWindow);
		const size = useWindowSize({
			window: currentWindow,
		});

		expect(size.width.value).toBe(1024);
		expect(size.height.value).toBe(768);

		currentWindow.value = secondWindow;
		expect(size.width.value).toBe(1440);
		expect(size.height.value).toBe(900);

		firstWindow.setSize(800, 600);
		expect(size.width.value).toBe(1440);
		expect(size.height.value).toBe(900);

		secondWindow.setSize(1200, 700);
		expect(size.width.value).toBe(1200);
		expect(size.height.value).toBe(700);
	});

	it("falls back to the initial window size when the window disappears", () => {
		const firstWindow = new FakeWindow();
		const currentWindow = signal<FakeWindow | null>(firstWindow);
		const size = useWindowSize({
			initialHeight: 240,
			initialWidth: 320,
			window: currentWindow,
		});

		expect(size.width.value).toBe(1024);
		expect(size.height.value).toBe(768);

		currentWindow.value = null;
		expect(size.width.value).toBe(320);
		expect(size.height.value).toBe(240);

		firstWindow.setSize(800, 600);
		expect(size.width.value).toBe(320);
		expect(size.height.value).toBe(240);
	});
});
