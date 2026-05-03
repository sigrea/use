import { disposeTrackedMolecules, signal } from "@sigrea/core";
import { afterEach, describe, expect, it } from "vitest";

import type { DocumentVisibilityDocumentLike } from "../types";
import { useDocumentVisibility } from "./index";

class FakeDocument
	extends EventTarget
	implements DocumentVisibilityDocumentLike
{
	visibilityState: DocumentVisibilityState;

	constructor(visibilityState: DocumentVisibilityState) {
		super();
		this.visibilityState = visibilityState;
	}

	dispatchVisibility(visibilityState: DocumentVisibilityState) {
		this.visibilityState = visibilityState;
		this.dispatchEvent(new Event("visibilitychange"));
	}
}

describe("useDocumentVisibility", () => {
	afterEach(() => {
		disposeTrackedMolecules();
	});

	it("reads the initial document visibility", () => {
		const fakeDocument = new FakeDocument("hidden");
		const visibility = useDocumentVisibility({
			document: fakeDocument,
		});

		expect(visibility.visibility.value).toBe("hidden");

		visibility.stop();
	});

	it("tracks visibilitychange events", () => {
		const fakeDocument = new FakeDocument("visible");
		const visibility = useDocumentVisibility({
			document: fakeDocument,
		});

		fakeDocument.dispatchVisibility("hidden");
		expect(visibility.visibility.value).toBe("hidden");

		visibility.stop();
		fakeDocument.dispatchVisibility("visible");
		expect(visibility.visibility.value).toBe("hidden");
	});

	it("falls back to visible when document is unavailable", () => {
		const visibility = useDocumentVisibility({
			document: null,
		});

		expect(visibility.visibility.value).toBe("visible");

		visibility.stop();
	});

	it("retargets when the document changes", () => {
		const firstDocument = new FakeDocument("visible");
		const secondDocument = new FakeDocument("hidden");
		const documentTarget = signal<DocumentVisibilityDocumentLike | null>(
			firstDocument,
		);
		const visibility = useDocumentVisibility({
			document: documentTarget,
		});

		expect(visibility.visibility.value).toBe("visible");

		documentTarget.value = secondDocument;
		expect(visibility.visibility.value).toBe("hidden");

		firstDocument.dispatchVisibility("hidden");
		expect(visibility.visibility.value).toBe("hidden");

		secondDocument.dispatchVisibility("visible");
		expect(visibility.visibility.value).toBe("visible");

		visibility.stop();
	});
});
