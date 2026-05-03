import {
	disposeTrackedMolecules,
	molecule,
	mountMolecule,
	signal,
	trackMolecule,
	unmountMolecule,
} from "@sigrea/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useEventListener } from "../useEventListener";
import { useMediaQuery } from "../useMediaQuery";
import { useWindowSize } from "../useWindowSize";

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

class FakeWindow extends EventTarget {
	document = {
		documentElement: {
			clientHeight: 720,
			clientWidth: 960,
		},
	};
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

describe("browser composables", () => {
	const originalWindow = globalThis.window;

	afterEach(() => {
		disposeTrackedMolecules();

		if (originalWindow === undefined) {
			Reflect.deleteProperty(globalThis, "window");
			return;
		}

		Object.defineProperty(globalThis, "window", {
			configurable: true,
			value: originalWindow,
			writable: true,
		});
	});

	it("exposes a stop handle for event listeners", () => {
		const target = new EventTarget();
		const listener = vi.fn();
		const subscription = useEventListener(target, "ping", listener);

		target.dispatchEvent(new Event("ping"));
		expect(listener).toHaveBeenCalledTimes(1);

		subscription.stop();
		target.dispatchEvent(new Event("ping"));
		expect(listener).toHaveBeenCalledTimes(1);
	});

	it("listens on window when the target is omitted", () => {
		const listener = vi.fn();
		const subscription = useEventListener("resize", listener);

		window.dispatchEvent(new Event("resize"));
		expect(listener).toHaveBeenCalledTimes(1);

		subscription.stop();
		window.dispatchEvent(new Event("resize"));
		expect(listener).toHaveBeenCalledTimes(1);
	});

	it("can watch a reactive event name when the target is omitted", () => {
		const eventName = signal<"resize" | "scroll">("resize");
		const listener = vi.fn();
		const subscription = useEventListener(() => eventName.value, listener);

		window.dispatchEvent(new Event("resize"));
		expect(listener).toHaveBeenCalledTimes(1);

		eventName.value = "scroll";
		window.dispatchEvent(new Event("resize"));
		expect(listener).toHaveBeenCalledTimes(1);

		window.dispatchEvent(new Event("scroll"));
		expect(listener).toHaveBeenCalledTimes(2);

		subscription.stop();
		window.dispatchEvent(new Event("scroll"));
		expect(listener).toHaveBeenCalledTimes(2);
	});

	it("removes listeners with the original options snapshot", () => {
		const target = new EventTarget();
		const listener = vi.fn();
		const options: AddEventListenerOptions = { capture: true };
		const subscription = useEventListener(target, "ping", listener, options);

		target.dispatchEvent(new Event("ping"));
		expect(listener).toHaveBeenCalledTimes(1);

		options.capture = false;
		subscription.stop();
		target.dispatchEvent(new Event("ping"));
		expect(listener).toHaveBeenCalledTimes(1);
	});

	it("retargets event listeners when the source target changes", () => {
		const firstTarget = new EventTarget();
		const secondTarget = new EventTarget();
		const currentTarget = signal(firstTarget);
		const listener = vi.fn();
		const subscription = useEventListener(currentTarget, "ping", listener);

		firstTarget.dispatchEvent(new Event("ping"));
		expect(listener).toHaveBeenCalledTimes(1);

		currentTarget.value = secondTarget;
		firstTarget.dispatchEvent(new Event("ping"));
		expect(listener).toHaveBeenCalledTimes(1);

		secondTarget.dispatchEvent(new Event("ping"));
		expect(listener).toHaveBeenCalledTimes(2);

		subscription.stop();
		secondTarget.dispatchEvent(new Event("ping"));
		expect(listener).toHaveBeenCalledTimes(2);
	});

	it("stops listening when a reactive target becomes unavailable", () => {
		const target = new EventTarget();
		const currentTarget = signal<EventTarget | null>(target);
		const listener = vi.fn();
		const subscription = useEventListener(currentTarget, "ping", listener);

		target.dispatchEvent(new Event("ping"));
		expect(listener).toHaveBeenCalledTimes(1);

		currentTarget.value = null;
		target.dispatchEvent(new Event("ping"));
		expect(listener).toHaveBeenCalledTimes(1);

		subscription.stop();
		target.dispatchEvent(new Event("ping"));
		expect(listener).toHaveBeenCalledTimes(1);
	});

	it("can watch a reactive event name on an explicit target", () => {
		const target = new EventTarget();
		const eventName = signal("ping");
		const listener = vi.fn();
		const subscription = useEventListener(
			target,
			() => eventName.value,
			listener,
		);

		target.dispatchEvent(new Event("ping"));
		expect(listener).toHaveBeenCalledTimes(1);

		eventName.value = "pong";
		target.dispatchEvent(new Event("ping"));
		expect(listener).toHaveBeenCalledTimes(1);

		target.dispatchEvent(new Event("pong"));
		expect(listener).toHaveBeenCalledTimes(2);

		subscription.stop();
	});

	it("re-registers listeners when the options change", () => {
		const target = new EventTarget();
		const addSpy = vi.spyOn(target, "addEventListener");
		const removeSpy = vi.spyOn(target, "removeEventListener");
		const listener = vi.fn();
		const options = signal<boolean | AddEventListenerOptions>(false);
		const subscription = useEventListener(target, "ping", listener, options);

		expect(addSpy).toHaveBeenCalledTimes(1);
		expect(addSpy.mock.calls[0]?.[2]).toBe(false);

		options.value = { capture: true };
		expect(removeSpy).toHaveBeenCalledTimes(1);
		expect(removeSpy.mock.calls[0]?.[2]).toBe(false);
		expect(addSpy).toHaveBeenCalledTimes(2);
		expect(addSpy.mock.calls[1]?.[2]).toEqual({ capture: true });

		subscription.stop();
		expect(removeSpy).toHaveBeenCalledTimes(2);
		expect(removeSpy.mock.calls[1]?.[2]).toEqual({ capture: true });
	});

	it("binds event listeners to molecule mount and unmount", () => {
		const target = new EventTarget();
		const listener = vi.fn();
		const ListenerMolecule = molecule(() =>
			useEventListener(target, "ping", listener),
		);
		const instance = ListenerMolecule();
		trackMolecule(instance);

		target.dispatchEvent(new Event("ping"));
		expect(listener).toHaveBeenCalledTimes(0);

		mountMolecule(instance);
		target.dispatchEvent(new Event("ping"));
		expect(listener).toHaveBeenCalledTimes(1);

		unmountMolecule(instance);
		target.dispatchEvent(new Event("ping"));
		expect(listener).toHaveBeenCalledTimes(1);
	});

	it("tracks media query changes", () => {
		const fakeWindow = new FakeWindow();
		fakeWindow.setQuery("(min-width: 768px)", false);
		const query = signal("(min-width: 768px)");
		const mediaQuery = useMediaQuery(query, {
			window: fakeWindow as unknown as Window,
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
				window: fakeWindow as unknown as Window,
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
		const currentWindow = signal<Window | null>(
			firstWindow as unknown as Window,
		);
		const mediaQuery = useMediaQuery("(min-width: 768px)", {
			window: currentWindow,
		});

		expect(mediaQuery.matches.value).toBe(false);

		currentWindow.value = secondWindow as unknown as Window;
		expect(mediaQuery.matches.value).toBe(true);

		firstWindow.dispatchQuery("(min-width: 768px)", true);
		expect(mediaQuery.matches.value).toBe(true);

		secondWindow.dispatchQuery("(min-width: 768px)", false);
		expect(mediaQuery.matches.value).toBe(false);
	});

	it("falls back to the initial media query value when the window disappears", () => {
		const firstWindow = new FakeWindow();
		firstWindow.setQuery("(min-width: 768px)", false);
		const currentWindow = signal<Window | null>(
			firstWindow as unknown as Window,
		);
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

	it("tracks window size updates", () => {
		const fakeWindow = new FakeWindow();
		const size = useWindowSize({
			window: fakeWindow as unknown as Window,
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
			window: fakeWindow as unknown as Window,
		});

		expect(size.width.value).toBe(1600);
		expect(size.height.value).toBe(1000);
	});

	it("can exclude the scrollbar from the window size", () => {
		const fakeWindow = new FakeWindow();
		fakeWindow.setDocumentSize(980, 740);
		const size = useWindowSize({
			includeScrollbar: false,
			window: fakeWindow as unknown as Window,
		});

		expect(size.width.value).toBe(980);
		expect(size.height.value).toBe(740);
	});

	it("can read the visual viewport size", () => {
		const fakeWindow = new FakeWindow();
		const size = useWindowSize({
			type: "visual",
			window: fakeWindow as unknown as Window,
		});

		expect(size.width.value).toBe(720);
		expect(size.height.value).toBe(540);

		fakeWindow.visualViewport.setSize(500, 300, 1.5);
		expect(size.width.value).toBe(500);
		expect(size.height.value).toBe(300);
	});

	it("updates the window size when the orientation media query changes", () => {
		const fakeWindow = new FakeWindow();
		fakeWindow.setDocumentSize(980, 740);
		fakeWindow.setQuery("(orientation: portrait)", false);
		const size = useWindowSize({
			includeScrollbar: false,
			window: fakeWindow as unknown as Window,
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
				window: fakeWindow as unknown as Window,
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
		const currentWindow = signal<Window | null>(
			firstWindow as unknown as Window,
		);
		const size = useWindowSize({
			window: currentWindow,
		});

		expect(size.width.value).toBe(1024);
		expect(size.height.value).toBe(768);

		currentWindow.value = secondWindow as unknown as Window;
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
		const currentWindow = signal<Window | null>(
			firstWindow as unknown as Window,
		);
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
