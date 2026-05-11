import { signal } from "@sigrea/core";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { onStartTyping } from "./index";

describe("onStartTyping", () => {
	let callback: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		callback = vi.fn();
		document.body.focus();
	});

	function dispatchKeyDown(
		key: string,
		options: KeyboardEventInit = {},
		target: Document = document,
	): void {
		target.dispatchEvent(
			new KeyboardEvent("keydown", {
				bubbles: true,
				cancelable: true,
				key,
				...options,
			}),
		);
	}

	function focus(element: HTMLElement): void {
		document.body.appendChild(element);
		element.focus();
	}

	it("triggers callback with letters and numbers", () => {
		const stop = onStartTyping(callback);

		dispatchKeyDown("a");
		dispatchKeyDown("Z");
		dispatchKeyDown("1");

		expect(callback).toHaveBeenCalledTimes(3);
		stop();
	});

	it("supports legacy keyCode values", () => {
		const stop = onStartTyping(callback);

		dispatchKeyDown("", { keyCode: 65 });
		dispatchKeyDown("", { keyCode: 48 });
		dispatchKeyDown("", { keyCode: 96 });

		expect(callback).toHaveBeenCalledTimes(3);
		stop();
	});

	it("ignores non-typing keys", () => {
		const stop = onStartTyping(callback);

		dispatchKeyDown("ArrowLeft", { keyCode: 37 });
		dispatchKeyDown("F1", { keyCode: 112 });
		dispatchKeyDown("Enter", { keyCode: 13 });

		expect(callback).not.toHaveBeenCalled();
		stop();
	});

	it("ignores modified keys", () => {
		const stop = onStartTyping(callback);

		dispatchKeyDown("a", { altKey: true });
		dispatchKeyDown("a", { ctrlKey: true });
		dispatchKeyDown("a", { metaKey: true });

		expect(callback).not.toHaveBeenCalled();
		stop();
	});

	it("allows shifted alphanumeric keys", () => {
		const stop = onStartTyping(callback);

		dispatchKeyDown("A", { shiftKey: true });

		expect(callback).toHaveBeenCalledTimes(1);
		stop();
	});

	it("ignores shifted symbol keys even when keyCode is numeric", () => {
		const stop = onStartTyping(callback);

		dispatchKeyDown("!", { keyCode: 49, shiftKey: true });

		expect(callback).not.toHaveBeenCalled();
		stop();
	});

	it("ignores typing while input elements are focused", () => {
		const input = document.createElement("input");
		const stop = onStartTyping(callback);

		focus(input);
		dispatchKeyDown("a");

		expect(callback).not.toHaveBeenCalled();
		stop();
	});

	it("ignores typing while textarea elements are focused", () => {
		const textarea = document.createElement("textarea");
		const stop = onStartTyping(callback);

		focus(textarea);
		dispatchKeyDown("a");

		expect(callback).not.toHaveBeenCalled();
		stop();
	});

	it("ignores typing while select elements are focused", () => {
		const select = document.createElement("select");
		const stop = onStartTyping(callback);

		focus(select);
		dispatchKeyDown("a");

		expect(callback).not.toHaveBeenCalled();
		stop();
	});

	it("ignores typing while contenteditable elements are focused", () => {
		const editor = document.createElement("div");
		const stop = onStartTyping(callback);

		editor.setAttribute("contenteditable", "true");
		editor.tabIndex = 0;
		focus(editor);
		dispatchKeyDown("a");

		expect(callback).not.toHaveBeenCalled();
		stop();
	});

	it("ignores typing for empty and plaintext-only contenteditable values", () => {
		const plainEditor = document.createElement("div");
		const plaintextEditor = document.createElement("div");
		const stop = onStartTyping(callback);

		plainEditor.setAttribute("contenteditable", "");
		plainEditor.tabIndex = 0;
		focus(plainEditor);
		dispatchKeyDown("a");

		plaintextEditor.setAttribute("contenteditable", "plaintext-only");
		plaintextEditor.tabIndex = 0;
		focus(plaintextEditor);
		dispatchKeyDown("b");

		expect(callback).not.toHaveBeenCalled();
		stop();
	});

	it("treats contenteditable values case-insensitively", () => {
		const trueEditor = document.createElement("div");
		const plaintextEditor = document.createElement("div");
		const stop = onStartTyping(callback);

		trueEditor.setAttribute("contenteditable", "TRUE");
		trueEditor.tabIndex = 0;
		focus(trueEditor);
		dispatchKeyDown("a");

		plaintextEditor.setAttribute("contenteditable", "PlainText-Only");
		plaintextEditor.tabIndex = 0;
		focus(plaintextEditor);
		dispatchKeyDown("b");

		expect(callback).not.toHaveBeenCalled();
		stop();
	});

	it("ignores typing while focus is inside contenteditable elements", () => {
		const editor = document.createElement("div");
		const child = document.createElement("button");
		const stop = onStartTyping(callback);

		editor.setAttribute("contenteditable", "true");
		child.tabIndex = 0;
		editor.appendChild(child);
		document.body.appendChild(editor);
		child.focus();
		dispatchKeyDown("a");

		expect(callback).not.toHaveBeenCalled();
		stop();
	});

	it("does not treat contenteditable false as editable", () => {
		const editor = document.createElement("div");
		const stop = onStartTyping(callback);

		editor.setAttribute("contenteditable", "false");
		editor.tabIndex = 0;
		focus(editor);
		dispatchKeyDown("a");

		expect(callback).toHaveBeenCalledTimes(1);
		stop();
	});

	it("ignores typing in designMode documents", () => {
		const editableDocument = document.implementation.createHTMLDocument();
		editableDocument.designMode = "on";
		const stop = onStartTyping(callback, {
			document: editableDocument,
		});

		dispatchKeyDown("a", {}, editableDocument);

		expect(callback).not.toHaveBeenCalled();
		editableDocument.designMode = "off";
		stop();
	});

	it("listens on a custom document", () => {
		const iframe = document.createElement("iframe");
		document.body.appendChild(iframe);
		const iframeDocument = iframe.contentDocument;
		expect(iframeDocument).not.toBeNull();
		const stop = onStartTyping(callback, {
			document: iframeDocument,
		});

		dispatchKeyDown("a", {}, iframeDocument as Document);
		dispatchKeyDown("a");

		expect(callback).toHaveBeenCalledTimes(1);
		stop();
	});

	it("uses the custom document active element for editable checks", () => {
		const iframe = document.createElement("iframe");
		document.body.appendChild(iframe);
		const iframeDocument = iframe.contentDocument;
		expect(iframeDocument).not.toBeNull();
		const editor = (iframeDocument as Document).createElement("div");
		editor.setAttribute("contenteditable", "plaintext-only");
		editor.tabIndex = 0;
		(iframeDocument as Document).body.appendChild(editor);
		const stop = onStartTyping(callback, {
			document: iframeDocument,
		});

		editor.focus();
		dispatchKeyDown("a", {}, iframeDocument as Document);

		expect(callback).not.toHaveBeenCalled();
		stop();
	});

	it("follows a reactive document", () => {
		const first = document.implementation.createHTMLDocument("first");
		const second = document.implementation.createHTMLDocument("second");
		const documentTarget = signal<Document | null>(first);
		const stop = onStartTyping(callback, { document: documentTarget });

		dispatchKeyDown("a", {}, first);
		expect(callback).toHaveBeenCalledTimes(1);

		documentTarget.value = second;
		dispatchKeyDown("b", {}, first);
		dispatchKeyDown("c", {}, second);

		expect(callback).toHaveBeenCalledTimes(2);
		stop();
	});

	it("does nothing while the document is null", () => {
		const documentTarget = signal<Document | null>(document);
		const stop = onStartTyping(callback, { document: documentTarget });

		documentTarget.value = null;
		dispatchKeyDown("a");

		expect(callback).not.toHaveBeenCalled();
		stop();
	});

	it("returns a stop function", () => {
		const stop = onStartTyping(callback);

		stop();
		dispatchKeyDown("a");

		expect(callback).not.toHaveBeenCalled();
	});
});
