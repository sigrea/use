import {
	disposeTrackedMolecules,
	molecule,
	mountMolecule,
	signal,
	trackMolecule,
	unmountMolecule,
} from "@sigrea/core";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type {
	UseActiveElementDocumentLike,
	UseActiveElementWindowLike,
} from "../types";
import { useActiveElement } from "./index";

async function flushMutationObserver(): Promise<void> {
	await Promise.resolve();
	await Promise.resolve();
}

describe("useActiveElement", () => {
	let host: HTMLDivElement;
	let input: HTMLInputElement;
	let shadowInput: HTMLInputElement;
	let shadowRoot: ShadowRoot;

	beforeEach(() => {
		host = document.createElement("div");
		shadowRoot = host.attachShadow({ mode: "open" });
		input = document.createElement("input");
		shadowInput = document.createElement("input");
		shadowRoot.append(shadowInput);
		document.body.append(input, host);
	});

	afterEach(() => {
		document.body.innerHTML = "";
		disposeTrackedMolecules();
	});

	it("reads the initial active element", () => {
		const active = useActiveElement();

		expect(active.activeElement.value).toBe(document.body);

		active.stop();
	});

	it("reads an already focused element", () => {
		input.focus();

		const active = useActiveElement();

		expect(active.activeElement.value).toBe(input);

		active.stop();
	});

	it("tracks focus and blur events", () => {
		const active = useActiveElement();

		input.focus();
		expect(active.activeElement.value).toBe(input);

		input.blur();
		expect(active.activeElement.value).toBe(document.body);

		active.stop();
	});

	it("traverses into shadow roots by default", () => {
		const active = useActiveElement();

		shadowInput.focus();

		expect(document.activeElement).toBe(host);
		expect(active.activeElement.value).toBe(shadowInput);

		active.stop();
	});

	it("can keep the shadow host as the active element", () => {
		const active = useActiveElement({ deep: false });

		shadowInput.focus();

		expect(active.activeElement.value).toBe(host);

		active.stop();
	});

	it("returns null for an empty focused shadow root", () => {
		host.tabIndex = 0;
		const active = useActiveElement();

		host.focus();

		expect(document.activeElement).toBe(host);
		expect(active.activeElement.value).toBe(null);

		active.stop();
	});

	it("accepts a custom shadow root document", () => {
		const active = useActiveElement({ document: shadowRoot });

		shadowInput.focus();

		expect(active.activeElement.value).toBe(shadowInput);

		active.stop();
	});

	it("derives listener window from a custom document", () => {
		const secondInput = document.createElement("input");
		const customWindow = new EventTarget() as UseActiveElementWindowLike &
			EventTarget;
		const customDocument = {
			activeElement: input,
			defaultView: customWindow,
		} as unknown as UseActiveElementDocumentLike & {
			activeElement: Element | null;
		};
		Object.defineProperty(customWindow, "document", {
			value: customDocument,
		});
		const active = useActiveElement({ document: customDocument });

		expect(active.activeElement.value).toBe(input);

		customDocument.activeElement = secondInput;
		window.dispatchEvent(new FocusEvent("focus"));
		expect(active.activeElement.value).toBe(input);

		customWindow.dispatchEvent(new FocusEvent("focus"));
		expect(active.activeElement.value).toBe(secondInput);

		active.stop();
	});

	it("does not use the default window when window is null", () => {
		const secondInput = document.createElement("input");
		document.body.append(secondInput);
		const active = useActiveElement({ window: null });

		expect(active.activeElement.value).toBeUndefined();

		secondInput.focus();
		window.dispatchEvent(new FocusEvent("focus"));

		expect(active.activeElement.value).toBeUndefined();

		active.stop();
	});

	it("does not mix a custom window with the default document", () => {
		const secondInput = document.createElement("input");
		document.body.append(secondInput);
		const customWindow = new EventTarget() as UseActiveElementWindowLike &
			EventTarget;
		const active = useActiveElement({ window: customWindow });

		expect(active.activeElement.value).toBeUndefined();

		secondInput.focus();
		customWindow.dispatchEvent(new FocusEvent("focus"));

		expect(active.activeElement.value).toBeUndefined();

		active.stop();
	});

	it("retargets when the document target changes", () => {
		input.focus();
		const documentTarget = signal<UseActiveElementDocumentLike | null>(
			document,
		);
		const active = useActiveElement({ document: documentTarget });

		expect(active.activeElement.value).toBe(input);

		documentTarget.value = shadowRoot;
		expect(active.activeElement.value).toBe(null);

		shadowInput.focus();
		expect(active.activeElement.value).toBe(shadowInput);

		active.stop();
	});

	it("updates when the active element is removed from the document", async () => {
		const active = useActiveElement({ triggerOnRemoval: true });

		input.focus();
		expect(active.activeElement.value).toBe(input);

		input.remove();
		await flushMutationObserver();

		expect(active.activeElement.value).toBe(document.body);

		active.stop();
	});

	it("updates when the deep active element is removed from its shadow root", async () => {
		const active = useActiveElement({ triggerOnRemoval: true });

		shadowInput.focus();
		expect(active.activeElement.value).toBe(shadowInput);

		shadowInput.remove();
		await flushMutationObserver();

		expect(active.activeElement.value).toBe(document.body);

		active.stop();
	});

	it("updates when the shadow host containing the active element is removed", async () => {
		const active = useActiveElement({ triggerOnRemoval: true });

		shadowInput.focus();
		expect(active.activeElement.value).toBe(shadowInput);

		host.remove();
		await flushMutationObserver();

		expect(active.activeElement.value).toBe(document.body);

		active.stop();
	});

	it("updates when the active element is removed from a shadow root", async () => {
		const active = useActiveElement({
			document: shadowRoot,
			triggerOnRemoval: true,
		});

		shadowInput.focus();
		expect(active.activeElement.value).toBe(shadowInput);

		shadowInput.remove();
		await flushMutationObserver();

		expect(active.activeElement.value).toBe(null);

		active.stop();
	});

	it("stops tracking when stopped", () => {
		const secondInput = document.createElement("input");
		document.body.append(secondInput);
		const active = useActiveElement();

		input.focus();
		expect(active.activeElement.value).toBe(input);

		active.stop();
		secondInput.focus();

		expect(active.activeElement.value).toBe(input);
	});

	it("tracks only while a molecule is mounted", () => {
		const secondInput = document.createElement("input");
		document.body.append(secondInput);
		const UseActive = molecule(() => useActiveElement());
		const active = UseActive();
		trackMolecule(active);

		input.focus();
		expect(active.activeElement.value).toBe(document.body);

		mountMolecule(active);
		expect(active.activeElement.value).toBe(input);

		secondInput.focus();
		expect(active.activeElement.value).toBe(secondInput);

		unmountMolecule(active);
		input.focus();
		expect(active.activeElement.value).toBe(secondInput);
	});
});
