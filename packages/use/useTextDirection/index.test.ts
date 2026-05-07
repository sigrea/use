import { disposeTrackedMolecules, signal } from "@sigrea/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import type {
	UseMutationObserverWindowLike,
	UseTextDirectionDocumentLike,
} from "../types";
import { useTextDirection } from "./index";

class FakeMutationObserver implements MutationObserver {
	static instances: FakeMutationObserver[] = [];

	static isObserving(target: Node): boolean {
		return FakeMutationObserver.instances.some((observer) =>
			observer.observed.has(target),
		);
	}

	static emitObserved(
		target: Node,
		values: Partial<MutationRecord> = {},
	): void {
		for (const observer of FakeMutationObserver.instances) {
			observer.emit(target, values);
		}
	}

	readonly observed = new Map<Node, MutationObserverInit>();

	constructor(private readonly callback: MutationCallback) {
		FakeMutationObserver.instances.push(this);
	}

	observe(target: Node, options?: MutationObserverInit): void {
		this.observed.set(target, options ?? {});
	}

	disconnect(): void {
		this.observed.clear();
	}

	takeRecords(): MutationRecord[] {
		return [];
	}

	emit(target: Node, values: Partial<MutationRecord> = {}): void {
		if (!this.observed.has(target)) {
			return;
		}

		this.callback([this.createRecord(target, values)], this);
	}

	private createRecord(
		target: Node,
		values: Partial<MutationRecord> = {},
	): MutationRecord {
		return {
			addedNodes: [] as unknown as NodeList,
			attributeName: "dir",
			attributeNamespace: null,
			nextSibling: null,
			oldValue: null,
			previousSibling: null,
			removedNodes: [] as unknown as NodeList,
			target,
			type: "attributes",
			...values,
		} as MutationRecord;
	}
}

class FakeWindowWithMutationObserver
	extends EventTarget
	implements UseMutationObserverWindowLike
{
	readonly document = document;
	readonly navigator = navigator;
	readonly MutationObserver = FakeMutationObserver as typeof MutationObserver;
}

function fakeDocumentFor(
	targetForSelector: (selector: string) => Element | null,
): UseTextDirectionDocumentLike {
	return Object.assign(new EventTarget(), {
		defaultView: new FakeWindowWithMutationObserver(),
		querySelector: targetForSelector,
	});
}

describe("useTextDirection", () => {
	afterEach(() => {
		FakeMutationObserver.instances = [];
		document.documentElement.removeAttribute("dir");
		document.body.removeAttribute("dir");
		document.body.innerHTML = "";
		disposeTrackedMolecules();
		vi.restoreAllMocks();
	});

	it("reads the html dir and falls back to ltr", () => {
		const fallback = useTextDirection();

		expect(fallback.value).toBe("ltr");
		expect(document.documentElement.hasAttribute("dir")).toBe(false);
		fallback.stop();

		document.documentElement.setAttribute("dir", "rtl");
		const direction = useTextDirection();

		expect(direction.value).toBe("rtl");

		direction.stop();
	});

	it("uses initialValue when the target has no dir", () => {
		const direction = useTextDirection({ initialValue: "auto" });

		expect(direction.value).toBe("auto");
		expect(document.documentElement.hasAttribute("dir")).toBe(false);

		direction.stop();
	});

	it("uses initialValue when the target dir is invalid", () => {
		document.documentElement.setAttribute("dir", "vertical");
		const direction = useTextDirection({ initialValue: "rtl" });

		expect(direction.value).toBe("rtl");

		direction.stop();
	});

	it("normalizes case-insensitive dir values", () => {
		document.documentElement.setAttribute("dir", "RTL");
		const direction = useTextDirection();

		expect(direction.value).toBe("rtl");

		direction.stop();
	});

	it("writes direction to the default target", () => {
		const direction = useTextDirection();

		direction.value = "rtl";
		expect(document.documentElement.getAttribute("dir")).toBe("rtl");

		direction.value = "auto";
		expect(document.documentElement.getAttribute("dir")).toBe("auto");

		direction.stop();
	});

	it("uses a custom selector", () => {
		const direction = useTextDirection({ selector: "body" });

		direction.value = "rtl";

		expect(document.documentElement.hasAttribute("dir")).toBe(false);
		expect(document.body.getAttribute("dir")).toBe("rtl");

		direction.stop();
	});

	it("uses a custom document", () => {
		const customDocument = document.implementation.createHTMLDocument();
		customDocument.documentElement.setAttribute("dir", "rtl");
		const direction = useTextDirection({ document: customDocument });

		expect(direction.value).toBe("rtl");

		direction.value = "auto";
		expect(customDocument.documentElement.getAttribute("dir")).toBe("auto");
		expect(document.documentElement.hasAttribute("dir")).toBe(false);

		direction.stop();
	});

	it("keeps writable state without a document", () => {
		const direction = useTextDirection({
			document: null,
			initialValue: "rtl",
		});

		expect(direction.value).toBe("rtl");

		direction.value = "auto";
		expect(direction.value).toBe("auto");
		expect(document.documentElement.hasAttribute("dir")).toBe(false);

		direction.stop();
	});

	it("does not observe external changes by default", () => {
		const target = document.createElement("div");
		const direction = useTextDirection({
			document: fakeDocumentFor(() => target),
		});

		target.setAttribute("dir", "rtl");
		FakeMutationObserver.emitObserved(target);

		expect(FakeMutationObserver.isObserving(target)).toBe(false);
		expect(direction.value).toBe("ltr");

		direction.stop();
	});

	it("observes target attribute changes when requested", () => {
		const target = document.createElement("div");
		const direction = useTextDirection({
			document: fakeDocumentFor(() => target),
			observe: true,
		});

		expect(FakeMutationObserver.isObserving(target)).toBe(true);

		target.setAttribute("dir", "RTL");
		FakeMutationObserver.emitObserved(target);
		expect(direction.value).toBe("rtl");

		target.setAttribute("dir", "AUTO");
		FakeMutationObserver.emitObserved(target);
		expect(direction.value).toBe("auto");

		target.removeAttribute("dir");
		FakeMutationObserver.emitObserved(target);
		expect(direction.value).toBe("ltr");

		direction.stop();
	});

	it("moves observation when the selector changes", () => {
		const first = document.createElement("div");
		const second = document.createElement("section");
		const selector = signal("html");
		const documentTarget = fakeDocumentFor((currentSelector) =>
			currentSelector === "body" ? second : first,
		);
		const direction = useTextDirection({
			document: documentTarget,
			observe: true,
			selector,
		});

		expect(FakeMutationObserver.isObserving(first)).toBe(true);

		selector.value = "body";

		expect(FakeMutationObserver.isObserving(second)).toBe(true);
		expect(direction.value).toBe("ltr");

		first.setAttribute("dir", "rtl");
		FakeMutationObserver.emitObserved(first);
		expect(direction.value).toBe("ltr");

		second.setAttribute("dir", "auto");
		FakeMutationObserver.emitObserved(second);
		expect(direction.value).toBe("auto");

		direction.stop();
	});

	it("stops observing attribute changes", () => {
		const target = document.createElement("div");
		const direction = useTextDirection({
			document: fakeDocumentFor(() => target),
			observe: true,
		});

		direction.stop();
		target.setAttribute("dir", "rtl");
		FakeMutationObserver.emitObserved(target);

		expect(FakeMutationObserver.isObserving(target)).toBe(false);
		expect(direction.value).toBe("ltr");

		direction.stop();
	});
});
