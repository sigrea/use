import { computed, readonly, signal } from "@sigrea/core";
import { describe, expect, it } from "vitest";

import type { CssSupportsLike, UseCssSupportsWindowLike } from "../types";
import { useCssSupports } from "./index";

type CssSupportsCall =
	| [conditionText: string]
	| [property: string, value: string];

class FakeCssSupports implements CssSupportsLike {
	readonly calls: CssSupportsCall[] = [];

	constructor(private readonly match: (call: CssSupportsCall) => boolean) {}

	supports(conditionText: string): boolean;
	supports(property: string, value: string): boolean;
	supports(first: string, ...rest: [] | [value: string]): boolean {
		const call = (
			rest.length === 0 ? [first] : [first, rest[0]]
		) as CssSupportsCall;
		this.calls.push(call);
		return this.match(call);
	}
}

class FakeWindow extends EventTarget implements UseCssSupportsWindowLike {
	readonly CSS: FakeCssSupports;

	constructor(match: (call: CssSupportsCall) => boolean) {
		super();
		this.CSS = new FakeCssSupports(match);
	}
}

class FakeWindowWithoutCss
	extends EventTarget
	implements UseCssSupportsWindowLike {}

describe("useCssSupports", () => {
	it("checks a supports condition with one CSS.supports argument", () => {
		const fakeWindow = new FakeWindow(
			(call) => call.length === 1 && call[0] === "display: flex",
		);
		const isSupported = useCssSupports("display: flex", {
			window: fakeWindow,
		});

		expect(isSupported.value).toBe(true);
		expect(fakeWindow.CSS.calls).toEqual([["display: flex"]]);
	});

	it("checks property and value with two CSS.supports arguments", () => {
		const fakeWindow = new FakeWindow(
			(call) =>
				call.length === 2 && call[0] === "transform-origin" && call[1] === "5%",
		);
		const isSupported = useCssSupports("transform-origin", "5%", {
			window: fakeWindow,
		});

		expect(isSupported.value).toBe(true);
		expect(fakeWindow.CSS.calls).toEqual([["transform-origin", "5%"]]);
	});

	it("reacts to property and value changes", () => {
		const fakeWindow = new FakeWindow(
			(call) =>
				call.length === 2 &&
				((call[0] === "transform-origin" && call[1] === "5%") ||
					(call[0] === "display" && call[1] === "flex")),
		);
		const property = signal("transform-origin");
		const value = signal("5%");
		const isSupported = useCssSupports(property, value, {
			window: fakeWindow,
		});

		expect(isSupported.value).toBe(true);

		value.value = "unknown";
		expect(isSupported.value).toBe(false);

		property.value = "display";
		value.value = "flex";
		expect(isSupported.value).toBe(true);
	});

	it("reacts to condition changes", () => {
		const fakeWindow = new FakeWindow(
			(call) => call.length === 1 && call[0] === "display: flex",
		);
		const condition = signal("display: flex");
		const isSupported = useCssSupports(readonly(condition), {
			window: fakeWindow,
		});

		expect(isSupported.value).toBe(true);

		condition.value = "unknown";
		expect(isSupported.value).toBe(false);
	});

	it("accepts computed values", () => {
		const fakeWindow = new FakeWindow(
			(call) =>
				call.length === 2 && call[0] === "display" && call[1] === "grid",
		);
		const displayValue = signal("grid");
		const isSupported = useCssSupports(
			() => "display",
			computed(() => displayValue.value),
			{ window: fakeWindow },
		);

		expect(isSupported.value).toBe(true);

		displayValue.value = "unknown";
		expect(isSupported.value).toBe(false);
	});

	it("keeps condition text separate from options", () => {
		const fakeWindow = new FakeWindow(
			(call) => call.length === 1 && call[0] === "display: flex",
		);
		const isSupported = useCssSupports("display: flex", {
			window: fakeWindow,
		});

		expect(isSupported.value).toBe(true);
		expect(fakeWindow.CSS.calls).toEqual([["display: flex"]]);
	});

	it("uses property and value mode when the second argument is undefined", () => {
		const fakeWindow = new FakeWindow(() => false);
		const isSupported = useCssSupports(
			"display: flex",
			undefined as unknown as string,
			{ window: fakeWindow },
		);

		expect(isSupported.value).toBe(false);
		expect(fakeWindow.CSS.calls).toEqual([["display: flex", "undefined"]]);
	});

	it("uses the initial value without a CSS.supports implementation", () => {
		const withoutCss = useCssSupports("display", "grid", {
			window: new FakeWindowWithoutCss(),
		});
		const explicitInitial = useCssSupports("display: grid", {
			initialValue: true,
			window: null,
		});

		expect(withoutCss.value).toBe(false);
		expect(explicitInitial.value).toBe(true);
	});

	it("does not resolve support values until CSS.supports is available", () => {
		const unsupported = useCssSupports(
			() => {
				throw new Error("condition should not be resolved");
			},
			{ initialValue: true, window: null },
		);

		expect(unsupported.value).toBe(true);
	});

	it("reacts when the window target changes", () => {
		const firstWindow = new FakeWindow(
			(call) => call.length === 2 && call[1] === "block",
		);
		const secondWindow = new FakeWindow(
			(call) => call.length === 2 && call[1] === "grid",
		);
		const currentWindow = signal<UseCssSupportsWindowLike | null>(firstWindow);
		const value = signal("block");
		const isSupported = useCssSupports("display", value, {
			window: currentWindow,
		});

		expect(isSupported.value).toBe(true);

		currentWindow.value = secondWindow;
		expect(isSupported.value).toBe(false);

		value.value = "grid";
		expect(isSupported.value).toBe(true);
		expect(firstWindow.CSS.calls).toEqual([["display", "block"]]);
	});

	it("falls back when the window target becomes unavailable", () => {
		const fakeWindow = new FakeWindow(
			(call) => call.length === 1 && call[0] === "display: flex",
		);
		const currentWindow = signal<UseCssSupportsWindowLike | null>(fakeWindow);
		const isSupported = useCssSupports("display: flex", {
			initialValue: false,
			window: currentWindow,
		});

		expect(isSupported.value).toBe(true);

		currentWindow.value = null;
		expect(isSupported.value).toBe(false);
	});
});
