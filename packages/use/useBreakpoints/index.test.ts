import { disposeTrackedMolecules, signal } from "@sigrea/core";
import { afterEach, describe, expect, it } from "vitest";

import type { MatchMediaWindow } from "../types";
import { useBreakpoints } from "./index";

class FakeMediaQueryList extends EventTarget implements MediaQueryList {
	private readonly changeListeners =
		new Set<EventListenerOrEventListenerObject>();
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

	get changeListenerCount(): number {
		return this.changeListeners.size;
	}

	addEventListener(
		type: string,
		callback: EventListenerOrEventListenerObject | null,
		options?: AddEventListenerOptions | boolean,
	): void {
		super.addEventListener(type, callback, options);
		if (type === "change" && callback !== null) {
			this.changeListeners.add(callback);
		}
	}

	removeEventListener(
		type: string,
		callback: EventListenerOrEventListenerObject | null,
		options?: EventListenerOptions | boolean,
	): void {
		super.removeEventListener(type, callback, options);
		if (type === "change" && callback !== null) {
			this.changeListeners.delete(callback);
		}
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

	update(matches: boolean) {
		if (this.matches === matches) {
			return;
		}

		this.matches = matches;
		const event = new Event("change");
		this.dispatchEvent(event);
		this.onchange?.call(this, event as MediaQueryListEvent);
	}
}

class FakeWindow implements MatchMediaWindow {
	private readonly queries = new Map<string, FakeMediaQueryList>();

	constructor(private width: number) {}

	matchMedia(query: string): MediaQueryList {
		let queryList = this.queries.get(query);
		if (queryList === undefined) {
			queryList = new FakeMediaQueryList(
				query,
				evaluateWidthQuery(query, this.width),
			);
			this.queries.set(query, queryList);
		}

		return queryList;
	}

	getQueryList(query: string): FakeMediaQueryList {
		const queryList = this.queries.get(query);
		if (queryList === undefined) {
			throw new Error(`Unknown media query: ${query}`);
		}

		return queryList;
	}

	setWidth(width: number) {
		this.width = width;
		for (const queryList of this.queries.values()) {
			queryList.update(evaluateWidthQuery(queryList.media, width));
		}
	}
}

function pxValue(value: string): number {
	const trimmedValue = value.trim();
	const calcMatch = trimmedValue.match(
		/^calc\(\s*(.+?)\s*([+-])\s*(-?\d+(?:\.\d+)?)px\s*\)$/i,
	);
	if (calcMatch !== null) {
		const baseValue = pxValue(calcMatch[1]);
		const offsetValue = Number.parseFloat(calcMatch[3]);
		return calcMatch[2] === "+"
			? baseValue + offsetValue
			: baseValue - offsetValue;
	}

	const parsedValue = Number.parseFloat(trimmedValue);
	return trimmedValue.toLowerCase().endsWith("rem")
		? parsedValue * 16
		: parsedValue;
}

function evaluateWidthQuery(query: string, width: number): boolean {
	return query.split(",").some((queryPart) => {
		const constraints = Array.from(
			queryPart.matchAll(
				/\(\s*(min|max)-width:\s*(calc\([^)]+\)|-?\d+(?:\.\d+)?(?:px|rem)?)\s*\)/gi,
			),
		);
		if (constraints.length === 0) {
			return false;
		}

		return constraints.every((constraint) => {
			const targetWidth = pxValue(constraint[2]);
			return constraint[1].toLowerCase() === "min"
				? width >= targetWidth
				: width <= targetWidth;
		});
	});
}

describe("useBreakpoints", () => {
	afterEach(() => {
		disposeTrackedMolecules();
	});

	it("tracks shortcut breakpoint matches", () => {
		const fakeWindow = new FakeWindow(800);
		const breakpoints = useBreakpoints(
			{
				lg: "64rem",
				md: 768,
				sm: 640,
			},
			{ window: fakeWindow },
		);

		expect(breakpoints.sm.matches.value).toBe(true);
		expect(breakpoints.md.matches.value).toBe(true);
		expect(breakpoints.lg.matches.value).toBe(false);

		fakeWindow.setWidth(1100);
		expect(breakpoints.lg.matches.value).toBe(true);

		breakpoints.stop();
	});

	it("stops shortcut media query listeners together", () => {
		const fakeWindow = new FakeWindow(800);
		const breakpoints = useBreakpoints(
			{
				lg: 1024,
				md: 768,
				sm: 640,
			},
			{ window: fakeWindow },
		);

		expect(
			fakeWindow.getQueryList("(min-width: 640px)").changeListenerCount,
		).toBe(1);
		expect(
			fakeWindow.getQueryList("(min-width: 768px)").changeListenerCount,
		).toBe(1);
		expect(
			fakeWindow.getQueryList("(min-width: 1024px)").changeListenerCount,
		).toBe(1);

		breakpoints.stop();

		expect(
			fakeWindow.getQueryList("(min-width: 640px)").changeListenerCount,
		).toBe(0);
		expect(
			fakeWindow.getQueryList("(min-width: 768px)").changeListenerCount,
		).toBe(0);
		expect(
			fakeWindow.getQueryList("(min-width: 1024px)").changeListenerCount,
		).toBe(0);

		const current = breakpoints.current();
		const active = breakpoints.active();
		fakeWindow.setWidth(1100);

		expect(breakpoints.lg.matches.value).toBe(false);
		expect(current.value).toStrictEqual(["sm", "md"]);
		expect(active.value).toBe("md");
		expect(
			fakeWindow.getQueryList("(min-width: 1024px)").changeListenerCount,
		).toBe(0);
	});

	it("uses max-width shortcut listeners with a window", () => {
		const fakeWindow = new FakeWindow(800);
		const breakpoints = useBreakpoints(
			{
				lg: 1024,
				md: 768,
				sm: 640,
			},
			{ strategy: "max-width", window: fakeWindow },
		);
		const current = breakpoints.current();
		const active = breakpoints.active();

		expect(breakpoints.sm.matches.value).toBe(false);
		expect(breakpoints.md.matches.value).toBe(false);
		expect(breakpoints.lg.matches.value).toBe(true);
		expect(current.value).toStrictEqual(["lg"]);
		expect(active.value).toBe("lg");
		expect(
			fakeWindow.getQueryList("(max-width: 640px)").changeListenerCount,
		).toBe(1);
		expect(
			fakeWindow.getQueryList("(max-width: 768px)").changeListenerCount,
		).toBe(1);
		expect(
			fakeWindow.getQueryList("(max-width: 1024px)").changeListenerCount,
		).toBe(1);

		fakeWindow.setWidth(700);

		expect(breakpoints.md.matches.value).toBe(true);
		expect(current.value).toStrictEqual(["md", "lg"]);
		expect(active.value).toBe("md");

		breakpoints.stop();

		expect(
			fakeWindow.getQueryList("(max-width: 640px)").changeListenerCount,
		).toBe(0);
		expect(
			fakeWindow.getQueryList("(max-width: 768px)").changeListenerCount,
		).toBe(0);
		expect(
			fakeWindow.getQueryList("(max-width: 1024px)").changeListenerCount,
		).toBe(0);

		fakeWindow.setWidth(500);
		expect(breakpoints.sm.matches.value).toBe(false);
	});

	it("returns media query handles from breakpoint methods", () => {
		const fakeWindow = new FakeWindow(768);
		const breakpoints = useBreakpoints(
			{
				lg: 1024,
				md: 768,
				sm: 640,
			},
			{ window: fakeWindow },
		);
		const greater = breakpoints.greater("md");
		const greaterOrEqual = breakpoints.greaterOrEqual("md");
		const smaller = breakpoints.smaller("md");
		const smallerOrEqual = breakpoints.smallerOrEqual("md");
		const between = breakpoints.between("md", "lg");

		expect(greater.matches.value).toBe(false);
		expect(greaterOrEqual.matches.value).toBe(true);
		expect(smaller.matches.value).toBe(false);
		expect(smallerOrEqual.matches.value).toBe(true);
		expect(between.matches.value).toBe(true);

		fakeWindow.setWidth(800);
		expect(greater.matches.value).toBe(true);

		greater.stop();
		fakeWindow.setWidth(768);
		expect(greater.matches.value).toBe(true);

		greaterOrEqual.stop();
		smaller.stop();
		smallerOrEqual.stop();
		between.stop();
		breakpoints.stop();
	});

	it("updates current and active breakpoints", () => {
		const fakeWindow = new FakeWindow(800);
		const breakpoints = useBreakpoints(
			{
				lg: "64rem",
				md: 768,
				sm: 640,
			},
			{ window: fakeWindow },
		);
		const current = breakpoints.current();
		const active = breakpoints.active();

		expect(current.value).toStrictEqual(["sm", "md"]);
		expect(active.value).toBe("md");

		fakeWindow.setWidth(1200);
		expect(current.value).toStrictEqual(["sm", "md", "lg"]);
		expect(active.value).toBe("lg");

		breakpoints.stop();
	});

	it("retargets shortcut handles when the window changes", () => {
		const firstWindow = new FakeWindow(500);
		const secondWindow = new FakeWindow(1100);
		const windowTarget = signal<MatchMediaWindow>(firstWindow);
		const breakpoints = useBreakpoints(
			{
				lg: 1024,
				md: 768,
			},
			{ window: windowTarget },
		);
		const current = breakpoints.current();
		const active = breakpoints.active();

		expect(breakpoints.md.matches.value).toBe(false);
		expect(current.value).toStrictEqual([]);
		expect(active.value).toBe("");

		windowTarget.value = secondWindow;

		expect(breakpoints.md.matches.value).toBe(true);
		expect(breakpoints.lg.matches.value).toBe(true);
		expect(current.value).toStrictEqual(["md", "lg"]);
		expect(active.value).toBe("lg");

		firstWindow.setWidth(1200);
		secondWindow.setWidth(700);

		expect(breakpoints.md.matches.value).toBe(false);
		expect(current.value).toStrictEqual([]);
		expect(active.value).toBe("");

		breakpoints.stop();
	});

	it("evaluates min-width breakpoints with ssrWidth", () => {
		const breakpoints = useBreakpoints(
			{
				lg: 992,
				md: "48rem",
				sm: 576,
				xs: 0,
			},
			{ ssrWidth: 768, window: null },
		);

		expect(breakpoints.current().value).toStrictEqual(["xs", "sm", "md"]);
		expect(breakpoints.active().value).toBe("md");
		expect(breakpoints.isGreater("md")).toBe(false);
		expect(breakpoints.isGreaterOrEqual("md")).toBe(true);
		expect(breakpoints.isSmaller("md")).toBe(false);
		expect(breakpoints.isSmallerOrEqual("md")).toBe(true);
		expect(breakpoints.isInBetween("md", "lg")).toBe(true);
		expect(breakpoints.md.matches.value).toBe(true);
		expect(breakpoints.lg.matches.value).toBe(false);

		breakpoints.stop();
	});

	it("supports max-width strategy", () => {
		const breakpoints = useBreakpoints(
			{
				"2xl": 1536,
				lg: 1024,
				md: 768,
				sm: 640,
				xl: 1280,
			},
			{ ssrWidth: 1100, strategy: "max-width", window: null },
		);

		expect(breakpoints.current().value).toStrictEqual(["xl", "2xl"]);
		expect(breakpoints.active().value).toBe("xl");
		expect(breakpoints.isGreater("md")).toBe(true);
		expect(breakpoints.isGreaterOrEqual("lg")).toBe(true);
		expect(breakpoints.isSmaller("xl")).toBe(true);
		expect(breakpoints.isSmallerOrEqual("md")).toBe(false);
		expect(breakpoints.isInBetween("lg", "xl")).toBe(true);
		expect(breakpoints.md.matches.value).toBe(false);
		expect(breakpoints.lg.matches.value).toBe(false);
		expect(breakpoints.xl.matches.value).toBe(true);
		expect(breakpoints["2xl"].matches.value).toBe(true);

		breakpoints.stop();
	});

	it("matches no shortcuts in max-width strategy above the largest breakpoint", () => {
		const breakpoints = useBreakpoints(
			{
				"2xl": 1536,
				lg: 1024,
				md: 768,
				sm: 640,
				xl: 1280,
			},
			{ ssrWidth: 1600, strategy: "max-width", window: null },
		);

		expect(breakpoints.current().value).toStrictEqual([]);
		expect(breakpoints.active().value).toBe("");
		expect(breakpoints.sm.matches.value).toBe(false);
		expect(breakpoints.lg.matches.value).toBe(false);
		expect(breakpoints.xl.matches.value).toBe(false);
		expect(breakpoints["2xl"].matches.value).toBe(false);

		breakpoints.stop();
	});

	it("uses pixel offsets for rem breakpoints", () => {
		const breakpoints = useBreakpoints(
			{
				lg: "64rem",
				md: "48rem",
				xl: "80rem",
			},
			{ ssrWidth: 1023, strategy: "max-width", window: null },
		);

		expect(breakpoints.current().value).toStrictEqual(["lg", "xl"]);
		expect(breakpoints.active().value).toBe("lg");
		expect(breakpoints.isSmaller("lg")).toBe(true);
		expect(breakpoints.md.matches.value).toBe(false);
		expect(breakpoints.lg.matches.value).toBe(true);

		breakpoints.stop();

		const boundaryBreakpoints = useBreakpoints(
			{
				lg: "64rem",
				md: "48rem",
				xl: "80rem",
			},
			{ ssrWidth: 1024, strategy: "max-width", window: null },
		);

		expect(boundaryBreakpoints.current().value).toStrictEqual(["lg", "xl"]);
		expect(boundaryBreakpoints.active().value).toBe("lg");
		expect(boundaryBreakpoints.isSmaller("lg")).toBe(false);
		expect(boundaryBreakpoints.md.matches.value).toBe(false);
		expect(boundaryBreakpoints.lg.matches.value).toBe(true);

		boundaryBreakpoints.stop();
	});
});
