import { disposeTrackedMolecules } from "@sigrea/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { UseScreenSafeAreaWindowLike } from "../types";
import { useScreenSafeArea } from "./index";

const TOP_VAR = "--sigrea-safe-area-top";
const RIGHT_VAR = "--sigrea-safe-area-right";
const BOTTOM_VAR = "--sigrea-safe-area-bottom";
const LEFT_VAR = "--sigrea-safe-area-left";

interface SafeAreaValues {
	top?: string;
	right?: string;
	bottom?: string;
	left?: string;
}

class FakeVisualViewport extends EventTarget {
	dispatchResize() {
		this.dispatchEvent(new Event("resize"));
	}
}

class FakeWindow extends EventTarget implements UseScreenSafeAreaWindowLike {
	readonly document = document;
	readonly visualViewport: FakeVisualViewport | null;
	private readonly values = new Map<string, string>();

	constructor(
		values: SafeAreaValues = {},
		options: { visualViewport?: FakeVisualViewport | null } = {},
	) {
		super();
		this.visualViewport = options.visualViewport ?? new FakeVisualViewport();
		this.setSafeArea(values);
	}

	readonly getComputedStyle = vi.fn(
		(_element: Element) =>
			({
				getPropertyValue: (property: string) => this.values.get(property) ?? "",
			}) as CSSStyleDeclaration,
	);

	setSafeArea(values: SafeAreaValues) {
		if (values.top !== undefined) {
			this.values.set(TOP_VAR, values.top);
		}
		if (values.right !== undefined) {
			this.values.set(RIGHT_VAR, values.right);
		}
		if (values.bottom !== undefined) {
			this.values.set(BOTTOM_VAR, values.bottom);
		}
		if (values.left !== undefined) {
			this.values.set(LEFT_VAR, values.left);
		}
	}

	dispatchResize() {
		this.dispatchEvent(new Event("resize"));
	}

	dispatchOrientationChange() {
		this.dispatchEvent(new Event("orientationchange"));
	}
}

function expectSafeArea(
	safeArea: ReturnType<typeof useScreenSafeArea>,
	values: Required<SafeAreaValues>,
) {
	expect(safeArea.top.value).toBe(values.top);
	expect(safeArea.right.value).toBe(values.right);
	expect(safeArea.bottom.value).toBe(values.bottom);
	expect(safeArea.left.value).toBe(values.left);
}

describe("useScreenSafeArea", () => {
	afterEach(() => {
		document.documentElement.removeAttribute("style");
		disposeTrackedMolecules();
		vi.restoreAllMocks();
	});

	it("sets env CSS variables and reads their computed values", () => {
		const safeArea = useScreenSafeArea({
			window: new FakeWindow({
				top: "12px",
				right: "4px",
				bottom: "24px",
				left: "8px",
			}),
		});

		expect(document.documentElement.style.getPropertyValue(TOP_VAR)).toBe(
			"env(safe-area-inset-top, 0px)",
		);
		expect(document.documentElement.style.getPropertyValue(RIGHT_VAR)).toBe(
			"env(safe-area-inset-right, 0px)",
		);
		expect(document.documentElement.style.getPropertyValue(BOTTOM_VAR)).toBe(
			"env(safe-area-inset-bottom, 0px)",
		);
		expect(document.documentElement.style.getPropertyValue(LEFT_VAR)).toBe(
			"env(safe-area-inset-left, 0px)",
		);
		expectSafeArea(safeArea, {
			top: "12px",
			right: "4px",
			bottom: "24px",
			left: "8px",
		});

		safeArea.stop();
	});

	it("updates values manually", () => {
		const fakeWindow = new FakeWindow({
			top: "0px",
			right: "0px",
			bottom: "0px",
			left: "0px",
		});
		const safeArea = useScreenSafeArea({ window: fakeWindow });

		fakeWindow.setSafeArea({
			top: "10px",
			right: "11px",
			bottom: "12px",
			left: "13px",
		});
		safeArea.update();

		expectSafeArea(safeArea, {
			top: "10px",
			right: "11px",
			bottom: "12px",
			left: "13px",
		});

		safeArea.stop();
	});

	it("updates from resize and orientation events", () => {
		const fakeWindow = new FakeWindow({ top: "1px" });
		const safeArea = useScreenSafeArea({ window: fakeWindow });

		fakeWindow.setSafeArea({ top: "2px" });
		fakeWindow.dispatchResize();
		expect(safeArea.top.value).toBe("2px");

		fakeWindow.setSafeArea({ top: "3px" });
		fakeWindow.dispatchOrientationChange();
		expect(safeArea.top.value).toBe("3px");

		fakeWindow.setSafeArea({ top: "4px" });
		fakeWindow.visualViewport?.dispatchResize();
		expect(safeArea.top.value).toBe("4px");

		safeArea.stop();
	});

	it("removes listeners and restores CSS variables on stop", () => {
		document.documentElement.style.setProperty(TOP_VAR, "previous");
		const fakeWindow = new FakeWindow({ top: "1px", right: "2px" });
		const safeArea = useScreenSafeArea({ window: fakeWindow });

		safeArea.stop();
		safeArea.stop();

		expect(document.documentElement.style.getPropertyValue(TOP_VAR)).toBe(
			"previous",
		);
		expect(document.documentElement.style.getPropertyValue(RIGHT_VAR)).toBe("");

		fakeWindow.setSafeArea({ top: "20px" });
		fakeWindow.dispatchResize();
		fakeWindow.dispatchOrientationChange();
		fakeWindow.visualViewport?.dispatchResize();

		expect(safeArea.top.value).toBe("1px");
	});

	it("keeps shared CSS variables until the last instance stops", () => {
		document.documentElement.style.setProperty(TOP_VAR, "previous");
		const fakeWindow = new FakeWindow({ top: "1px" });
		const first = useScreenSafeArea({ window: fakeWindow });
		const second = useScreenSafeArea({ window: fakeWindow });

		first.stop();

		expect(document.documentElement.style.getPropertyValue(TOP_VAR)).toBe(
			"env(safe-area-inset-top, 0px)",
		);

		fakeWindow.setSafeArea({ top: "2px" });
		fakeWindow.dispatchResize();
		expect(second.top.value).toBe("2px");

		second.stop();

		expect(document.documentElement.style.getPropertyValue(TOP_VAR)).toBe(
			"previous",
		);
	});

	it("does not fall back to the default window when window is null", () => {
		const addSpy = vi.spyOn(window, "addEventListener");
		const safeArea = useScreenSafeArea({ window: null });

		expect(addSpy).not.toHaveBeenCalled();
		expectSafeArea(safeArea, {
			top: "",
			right: "",
			bottom: "",
			left: "",
		});
		expect(document.documentElement.style.getPropertyValue(TOP_VAR)).toBe("");

		safeArea.stop();
	});

	it("returns empty strings when required DOM APIs are unavailable", () => {
		const missingDocumentWindow =
			new EventTarget() as UseScreenSafeAreaWindowLike;
		const missingElementWindow = Object.assign(new EventTarget(), {
			document: {},
		}) as UseScreenSafeAreaWindowLike;
		const missingComputedStyleWindow = Object.assign(new EventTarget(), {
			document,
		}) as UseScreenSafeAreaWindowLike;

		for (const windowTarget of [
			missingDocumentWindow,
			missingElementWindow,
			missingComputedStyleWindow,
		]) {
			const safeArea = useScreenSafeArea({ window: windowTarget });

			expectSafeArea(safeArea, {
				top: "",
				right: "",
				bottom: "",
				left: "",
			});
			expect(() => {
				safeArea.update();
				safeArea.stop();
			}).not.toThrow();
		}
	});

	it("uses the default window when window is undefined", () => {
		vi.spyOn(window, "getComputedStyle").mockImplementation(
			(_element: Element) =>
				({
					getPropertyValue: (property: string) =>
						property === TOP_VAR ? "default-top" : "",
				}) as CSSStyleDeclaration,
		);
		const safeArea = useScreenSafeArea({ window: undefined });

		expect(safeArea.top.value).toBe("default-top");

		safeArea.stop();
	});
});
