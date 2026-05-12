import {
	createScope,
	disposeScope,
	disposeTrackedMolecules,
	runWithScope,
	signal,
} from "@sigrea/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import type {
	UseMutationObserverWindowLike,
	UseTitleDocumentLike,
} from "../types";
import { useTitle } from "./index";

class FakeMutationObserver implements MutationObserver {
	static instances: FakeMutationObserver[] = [];

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

		this.callback(
			[
				{
					addedNodes: [] as unknown as NodeList,
					attributeName: null,
					attributeNamespace: null,
					nextSibling: null,
					oldValue: null,
					previousSibling: null,
					removedNodes: [] as unknown as NodeList,
					target,
					type: "childList",
					...values,
				} as MutationRecord,
			],
			this,
		);
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

function setGlobalTitle(title: string): void {
	document.head.innerHTML = "";
	document.title = title;
}

function createObservedDocument(
	title: string,
): Document & UseTitleDocumentLike {
	const targetDocument = document.implementation.createHTMLDocument(title);
	Object.defineProperty(targetDocument, "defaultView", {
		configurable: true,
		value: new FakeWindowWithMutationObserver(),
	});

	return targetDocument;
}

function titleElement(documentTarget: UseTitleDocumentLike): HTMLTitleElement {
	const element = documentTarget.head?.querySelector("title");
	if (element === undefined || element === null) {
		throw new Error("title element was not created");
	}

	return element;
}

function latestObserver(): FakeMutationObserver {
	const observer = FakeMutationObserver.instances.at(-1);
	if (observer === undefined) {
		throw new Error("MutationObserver was not created");
	}

	return observer;
}

describe("useTitle", () => {
	afterEach(() => {
		FakeMutationObserver.instances = [];
		setGlobalTitle("");
		disposeTrackedMolecules();
		vi.restoreAllMocks();
	});

	it("reads the current document title and restores it on stop", () => {
		setGlobalTitle("Original");
		const title = useTitle();

		expect(title.value).toBe("Original");
		expect(document.title).toBe("Original");

		title.value = "Next";
		expect(title.value).toBe("Next");
		expect(document.title).toBe("Next");

		title.stop();
		title.stop();
		expect(document.title).toBe("Original");

		title.value = "Ignored";
		expect(title.value).toBe("Ignored");
		expect(document.title).toBe("Original");
	});

	it("tracks a signal source and writes nullish values as an empty title", () => {
		setGlobalTitle("Original");
		const source = signal<string | null | undefined>("Source");
		const title = useTitle(source);

		expect(title.value).toBe("Source");
		expect(document.title).toBe("Source");

		source.value = "Changed";
		expect(title.value).toBe("Changed");
		expect(document.title).toBe("Changed");

		title.value = null;
		expect(title.value).toBeNull();
		expect(document.title).toBe("");

		source.value = undefined;
		expect(title.value).toBeUndefined();
		expect(document.title).toBe("");

		title.stop();
		expect(document.title).toBe("Original");
	});

	it("uses the current document title for literal nullish inputs", () => {
		setGlobalTitle("Original");
		const nullTitle = useTitle(null);

		expect(nullTitle.value).toBe("Original");
		expect(document.title).toBe("Original");

		nullTitle.value = "Changed";
		expect(document.title).toBe("Changed");
		nullTitle.stop();
		expect(document.title).toBe("Original");

		setGlobalTitle("Original");
		const undefinedTitle = useTitle(undefined);

		expect(undefinedTitle.value).toBe("Original");
		expect(document.title).toBe("Original");

		undefinedTitle.stop();
	});

	it("applies string, signal, and function title templates", () => {
		setGlobalTitle("Original");
		const template = signal("%s | App");
		const title = useTitle("Home", { titleTemplate: template });

		expect(title.value).toBe("Home");
		expect(document.title).toBe("Home | App");

		title.value = "Settings";
		expect(document.title).toBe("Settings | App");

		template.value = "Page: %s";
		expect(document.title).toBe("Page: Settings");
		title.stop();
		expect(document.title).toBe("Original");

		const functionTemplate = useTitle("Home", {
			titleTemplate: (nextTitle) => `${nextTitle} | Function`,
		});
		expect(functionTemplate.value).toBe("Home");
		expect(document.title).toBe("Home | Function");
		functionTemplate.stop();
	});

	it("treats zero-arity titleTemplate functions as title callbacks", () => {
		setGlobalTitle("Original");
		const title = useTitle("Home", {
			titleTemplate: (nextTitle = "Fallback") => `${nextTitle} | Default`,
		});

		expect(document.title).toBe("Home | Default");

		title.value = "Settings";

		expect(document.title).toBe("Settings | Default");
		title.stop();
		expect(document.title).toBe("Original");
	});

	it("does not use the global document when document is null", () => {
		setGlobalTitle("Original");
		const title = useTitle("Ignored", { document: null });

		expect(title.value).toBe("Ignored");
		expect(document.title).toBe("Original");

		title.value = "Still ignored";
		expect(title.value).toBe("Still ignored");
		expect(document.title).toBe("Original");

		title.stop();
		expect(document.title).toBe("Original");
	});

	it("syncs external document title changes when observe is true", () => {
		const documentTarget = createObservedDocument("Original");
		const title = useTitle("Managed", {
			document: documentTarget,
			observe: true,
		});
		const observer = latestObserver();

		expect(documentTarget.title).toBe("Managed");
		expect(observer.observed.get(titleElement(documentTarget))).toEqual({
			childList: true,
		});

		documentTarget.title = "External";
		observer.emit(titleElement(documentTarget));

		expect(title.value).toBe("External");
		expect(documentTarget.title).toBe("External");

		title.value = "Internal";
		expect(documentTarget.title).toBe("Internal");

		title.stop();
		documentTarget.title = "After stop";
		observer.emit(titleElement(documentTarget));

		expect(title.value).toBe("Internal");
		expect(documentTarget.title).toBe("After stop");
	});

	it("does not observe external changes by default", () => {
		const documentTarget = createObservedDocument("Original");
		const title = useTitle("Managed", {
			document: documentTarget,
			observe: false,
		});

		expect(FakeMutationObserver.instances).toHaveLength(0);

		documentTarget.title = "External";
		expect(title.value).toBe("Managed");

		title.stop();
		expect(documentTarget.title).toBe("Original");
	});

	it("supports custom restore behavior and restoreOnUnmount false", () => {
		setGlobalTitle("Original");
		const keepTitle = useTitle("Managed", { restoreOnUnmount: false });

		keepTitle.value = "Keep";
		keepTitle.stop();
		expect(document.title).toBe("Keep");

		setGlobalTitle("Original");
		const restoreOnUnmount = vi.fn(
			(original: string, current: string) => `${original} / ${current}`,
		);
		const customTitle = useTitle("Managed", { restoreOnUnmount });

		customTitle.value = "Current";
		customTitle.stop();

		expect(restoreOnUnmount).toHaveBeenCalledWith("Original", "Current");
		expect(document.title).toBe("Original / Current");

		setGlobalTitle("Original");
		const restoreTemplated = vi.fn(() => "Restored");
		const templatedTitle = useTitle("Home", {
			restoreOnUnmount: restoreTemplated,
			titleTemplate: "%s | App",
		});

		expect(document.title).toBe("Home | App");
		templatedTitle.stop();

		expect(restoreTemplated).toHaveBeenCalledWith("Original", "Home");
		expect(document.title).toBe("Restored");
	});

	it("restores the title when the current scope is disposed", () => {
		setGlobalTitle("Original");
		const scope = createScope();
		const title = runWithScope(scope, () => useTitle("Scoped"));

		expect(document.title).toBe("Scoped");

		disposeScope(scope);
		expect(document.title).toBe("Original");

		title.value = "Ignored";
		expect(document.title).toBe("Original");
	});

	it("moves title management when the document target changes", () => {
		const firstDocument = document.implementation.createHTMLDocument("First");
		const secondDocument = document.implementation.createHTMLDocument("Second");
		const documentTarget = signal<UseTitleDocumentLike | null>(firstDocument);
		const title = useTitle("Managed", { document: documentTarget });

		expect(firstDocument.title).toBe("Managed");
		expect(secondDocument.title).toBe("Second");

		documentTarget.value = secondDocument;

		expect(firstDocument.title).toBe("First");
		expect(secondDocument.title).toBe("Managed");

		title.stop();
		expect(secondDocument.title).toBe("Second");
	});
});
