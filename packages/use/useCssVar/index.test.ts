import { disposeTrackedMolecules, signal } from "@sigrea/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { UseCssVarWindowLike } from "../types";
import { useCssVar } from "./index";

class FakeMutationObserver implements MutationObserver {
	static instances: FakeMutationObserver[] = [];

	readonly observed = new Map<Node, MutationObserverInit>();

	constructor(private readonly callback: MutationCallback) {
		FakeMutationObserver.instances.push(this);
	}

	observe(target: Node, options?: MutationObserverInit) {
		this.observed.set(target, options ?? {});
	}

	disconnect() {
		this.observed.clear();
	}

	takeRecords(): MutationRecord[] {
		return [];
	}

	emit(target: Node, attributeName: string) {
		if (!this.observed.has(target)) {
			return;
		}

		this.callback(
			[
				{
					attributeName,
					target,
					type: "attributes",
				} as MutationRecord,
			],
			this,
		);
	}
}

class FakeWindow extends EventTarget implements UseCssVarWindowLike {
	readonly document = document;
	readonly getComputedStyle = vi.fn((element: Element) =>
		window.getComputedStyle(element),
	);
	readonly MutationObserver = FakeMutationObserver as typeof MutationObserver;
}

describe("useCssVar", () => {
	afterEach(() => {
		FakeMutationObserver.instances = [];
		document.body.innerHTML = "";
		const styles = document.head.querySelectorAll(
			"[data-use-css-var-test-style]",
		);
		for (let index = 0; index < styles.length; index += 1) {
			styles.item(index).remove();
		}
		document.documentElement.removeAttribute("style");
		disposeTrackedMolecules();
	});

	it("writes the initial value to the target element", () => {
		const element = document.createElement("div");
		const variable = useCssVar("--color", element, {
			initialValue: "red",
			window: new FakeWindow(),
		});

		expect(variable.value).toBe("red");
		expect(element.style.getPropertyValue("--color")).toBe("red");

		variable.stop();
	});

	it("reads an existing CSS variable from computed style", () => {
		const element = document.createElement("div");
		element.style.setProperty("--color", "red");
		const variable = useCssVar("--color", element, {
			initialValue: "blue",
			window: new FakeWindow(),
		});

		expect(variable.value).toBe("red");
		expect(element.style.getPropertyValue("--color")).toBe("red");

		variable.stop();
	});

	it("does not inline CSS variables read from stylesheets", () => {
		const style = document.createElement("style");
		style.dataset.useCssVarTestStyle = "";
		style.textContent = ".theme-red { --color: red; }";
		document.head.append(style);
		const element = document.createElement("div");
		element.className = "theme-red";
		document.body.append(element);
		const variable = useCssVar("--color", element, {
			initialValue: "blue",
			window: new FakeWindow(),
		});

		expect(variable.value).toBe("red");
		expect(element.style.getPropertyValue("--color")).toBe("");

		variable.stop();
	});

	it("uses the document element when no target is provided", () => {
		const variable = useCssVar("--root-color", undefined, {
			initialValue: "red",
			window: new FakeWindow(),
		});

		expect(variable.value).toBe("red");
		expect(
			document.documentElement.style.getPropertyValue("--root-color"),
		).toBe("red");

		variable.stop();
	});

	it("updates and removes the target style through the returned signal", () => {
		const element = document.createElement("div");
		const variable = useCssVar("--color", element, {
			window: new FakeWindow(),
		});

		expect(element.style.getPropertyValue("--color")).toBe("");

		variable.value = "blue";
		expect(variable.value).toBe("blue");
		expect(element.style.getPropertyValue("--color")).toBe("blue");

		variable.value = undefined;
		expect(variable.value).toBeUndefined();
		expect(element.style.getPropertyValue("--color")).toBe("");

		variable.stop();
	});

	it("moves the value when the target element changes", () => {
		const first = document.createElement("div");
		const second = document.createElement("div");
		const target = signal<Element | null>(first);
		const variable = useCssVar("--color", target, {
			initialValue: "red",
			window: new FakeWindow(),
		});

		expect(first.style.getPropertyValue("--color")).toBe("red");

		target.value = second;

		expect(first.style.getPropertyValue("--color")).toBe("");
		expect(second.style.getPropertyValue("--color")).toBe("red");
		expect(variable.value).toBe("red");

		variable.stop();
	});

	it("moves the value when the CSS variable name changes", () => {
		const element = document.createElement("div");
		element.style.setProperty("--color-one", "blue");
		const property = signal<string | null>("--color");
		const variable = useCssVar(property, element, {
			initialValue: "red",
			window: new FakeWindow(),
		});

		expect(element.style.getPropertyValue("--color")).toBe("red");

		property.value = "--color-one";

		expect(element.style.getPropertyValue("--color")).toBe("");
		expect(element.style.getPropertyValue("--color-one")).toBe("blue");
		expect(variable.value).toBe("blue");

		property.value = null;

		expect(element.style.getPropertyValue("--color-one")).toBe("");
		expect(element.style.getPropertyValue("null")).toBe("");
		expect(variable.value).toBe("blue");

		variable.stop();
	});

	it("uses the configured window for computed styles", () => {
		const element = document.createElement("div");
		element.style.setProperty("--color", "red");
		const fakeWindow = new FakeWindow();
		const variable = useCssVar("--color", element, {
			window: fakeWindow,
		});

		expect(variable.value).toBe("red");
		expect(fakeWindow.getComputedStyle).toHaveBeenCalledWith(element);

		variable.stop();
	});

	it("does not create a CSS property while the property name is nullish", () => {
		const element = document.createElement("div");
		const property = signal<string | null>(null);
		const variable = useCssVar(property, element, {
			initialValue: "red",
			window: new FakeWindow(),
		});

		expect(element.style.getPropertyValue("null")).toBe("");
		expect(element.style.getPropertyValue("--color")).toBe("");

		property.value = "--color";

		expect(element.style.getPropertyValue("--color")).toBe("red");
		expect(variable.value).toBe("red");

		variable.stop();
	});

	it("does not observe external changes while the property name is nullish", () => {
		const element = document.createElement("div");
		const property = signal<string | null>("--color");
		const variable = useCssVar(property, element, {
			initialValue: "red",
			observe: true,
			window: new FakeWindow(),
		});
		const observer = FakeMutationObserver.instances[0];

		property.value = null;

		expect(observer?.observed.has(element)).toBe(false);
		expect(FakeMutationObserver.instances).toHaveLength(1);
		expect(variable.value).toBe("red");

		element.style.setProperty("--color", "blue");
		observer?.emit(element, "style");

		expect(variable.value).toBe("red");

		property.value = "--color";
		const nextObserver = FakeMutationObserver.instances[1];

		expect(nextObserver?.observed.has(element)).toBe(true);

		variable.stop();
	});

	it("observes external style changes when requested", () => {
		const element = document.createElement("div");
		document.body.appendChild(element);
		const variable = useCssVar("--color", element, {
			initialValue: "red",
			observe: true,
			window: new FakeWindow(),
		});
		const observer = FakeMutationObserver.instances[0];

		expect(observer?.observed.get(element)).toEqual({
			attributeFilter: ["style", "class"],
			attributes: true,
		});

		element.style.setProperty("--color", "blue");
		observer?.emit(element, "style");

		expect(variable.value).toBe("blue");
		expect(element.style.getPropertyValue("--color")).toBe("blue");

		element.style.removeProperty("--color");
		observer?.emit(element, "style");

		expect(variable.value).toBeUndefined();
		expect(element.style.getPropertyValue("--color")).toBe("");

		variable.stop();
		element.style.setProperty("--color", "green");
		observer?.emit(element, "style");

		expect(variable.value).toBeUndefined();
	});

	it("observes class changes without pinning the initial computed value", () => {
		const style = document.createElement("style");
		style.dataset.useCssVarTestStyle = "";
		style.textContent = `
			.theme-red { --color: red; }
			.theme-blue { --color: blue; }
			.theme-green { --color: green; }
		`;
		document.head.append(style);
		const element = document.createElement("div");
		element.className = "theme-red";
		document.body.append(element);
		const variable = useCssVar("--color", element, {
			observe: true,
			window: new FakeWindow(),
		});
		const observer = FakeMutationObserver.instances[0];

		expect(variable.value).toBe("red");
		expect(element.style.getPropertyValue("--color")).toBe("");

		element.className = "theme-blue";
		observer?.emit(element, "class");

		expect(variable.value).toBe("blue");
		expect(element.style.getPropertyValue("--color")).toBe("");

		element.className = "theme-green";
		observer?.emit(element, "class");

		expect(variable.value).toBe("green");
		expect(element.style.getPropertyValue("--color")).toBe("");

		variable.value = "purple";
		expect(element.style.getPropertyValue("--color")).toBe("purple");

		variable.stop();
	});

	it("disconnects the old observer when the target element changes", () => {
		const first = document.createElement("div");
		const second = document.createElement("div");
		document.body.append(first, second);
		const target = signal<Element | null>(first);
		const variable = useCssVar("--color", target, {
			initialValue: "red",
			observe: true,
			window: new FakeWindow(),
		});
		const firstObserver = FakeMutationObserver.instances[0];

		target.value = second;
		const secondObserver = FakeMutationObserver.instances[1];

		expect(firstObserver?.observed.has(first)).toBe(false);
		expect(secondObserver?.observed.get(second)).toEqual({
			attributeFilter: ["style", "class"],
			attributes: true,
		});
		expect(variable.value).toBe("red");

		first.style.setProperty("--color", "blue");
		firstObserver?.emit(first, "style");

		expect(variable.value).toBe("red");

		second.style.setProperty("--color", "green");
		secondObserver?.emit(second, "style");

		expect(variable.value).toBe("green");

		variable.stop();
	});

	it("does not use the global window when window is null", () => {
		const originalComputedStyle = window.getComputedStyle;
		const getComputedStyle = vi.fn(originalComputedStyle);
		Object.defineProperty(window, "getComputedStyle", {
			configurable: true,
			value: getComputedStyle,
		});
		try {
			const variable = useCssVar("--root-color", undefined, {
				initialValue: "red",
				window: null,
			});

			expect(variable.value).toBe("red");
			expect(getComputedStyle).not.toHaveBeenCalled();
			expect(
				document.documentElement.style.getPropertyValue("--root-color"),
			).toBe("");

			variable.stop();
		} finally {
			Object.defineProperty(window, "getComputedStyle", {
				configurable: true,
				value: originalComputedStyle,
			});
		}
	});
});
