import {
	createScope,
	disposeMolecule,
	disposeScope,
	disposeTrackedMolecules,
	molecule,
	mountMolecule,
	runWithScope,
	signal,
	unmountMolecule,
} from "@sigrea/core";
import { afterEach, describe, expect, it } from "vitest";

import type { UseStyleTagDocumentLike } from "../types";
import { useStyleTag } from "./index";

function styleTags(documentTarget = document): HTMLStyleElement[] {
	return Array.from(
		documentTarget.head.querySelectorAll<HTMLStyleElement>("style"),
	);
}

describe("useStyleTag", () => {
	afterEach(() => {
		document.head.innerHTML = "";
		disposeTrackedMolecules();
	});

	it("loads a style immediately and updates css", () => {
		const style = useStyleTag(".demo { color: red; }", {
			document,
			media: "print",
			nonce: "nonce-value",
		});
		const element = styleTags()[0];

		expect(style.id).toMatch(/^sigrea_style_tag_\d+$/);
		expect(element).toBeInstanceOf(HTMLStyleElement);
		expect(element?.id).toBe(style.id);
		expect(element?.textContent).toBe(".demo { color: red; }");
		expect(element?.media).toBe("print");
		expect(element?.nonce).toBe("nonce-value");
		expect(style.isLoaded.value).toBe(true);

		style.css.value = ".demo { color: blue; }";

		expect(element?.textContent).toBe(".demo { color: blue; }");
	});

	it("supports manual load and unload without duplicates", () => {
		const style = useStyleTag(".manual { display: block; }", {
			document,
			id: "manual-style",
			manual: true,
		});

		expect(styleTags()).toHaveLength(0);
		expect(style.isLoaded.value).toBe(false);

		style.load();
		style.load();

		expect(styleTags()).toHaveLength(1);
		expect(styleTags()[0]?.id).toBe("manual-style");
		expect(style.isLoaded.value).toBe(true);

		style.unload();
		style.unload();

		expect(styleTags()).toHaveLength(0);
		expect(style.isLoaded.value).toBe(false);
	});

	it("tracks source css changes while loaded", () => {
		const source = signal(".source { color: red; }");
		const style = useStyleTag(source, {
			document,
			manual: true,
		});

		style.load();
		source.value = ".source { color: green; }";

		expect(style.css.value).toBe(".source { color: green; }");
		expect(styleTags()[0]?.textContent).toBe(".source { color: green; }");
	});

	it("reuses an existing style and restores it on unload", () => {
		const existing = document.createElement("style");
		existing.id = "existing-style";
		existing.media = "screen";
		existing.nonce = "existing-nonce";
		existing.textContent = ".existing { color: black; }";
		document.head.append(existing);
		const style = useStyleTag(".existing { color: white; }", {
			document,
			id: "existing-style",
			manual: true,
			media: "print",
			nonce: "new-nonce",
		});

		style.load();

		expect(styleTags()).toEqual([existing]);
		expect(existing.textContent).toBe(".existing { color: white; }");
		expect(existing.media).toBe("print");
		expect(existing.nonce).toBe("new-nonce");

		style.unload();

		expect(styleTags()).toEqual([existing]);
		expect(existing.textContent).toBe(".existing { color: black; }");
		expect(existing.media).toBe("screen");
		expect(existing.nonce).toBe("existing-nonce");
		expect(style.isLoaded.value).toBe(false);
	});

	it("restores a reused style without adding an empty nonce", () => {
		const existing = document.createElement("style");
		existing.id = "existing-style-without-nonce";
		existing.textContent = ".existing { color: black; }";
		document.head.append(existing);
		const style = useStyleTag(".existing { color: white; }", {
			document,
			id: "existing-style-without-nonce",
			manual: true,
			nonce: "new-nonce",
		});

		style.load();
		expect(existing.nonce).toBe("new-nonce");

		style.unload();

		expect(styleTags()).toEqual([existing]);
		expect(existing.textContent).toBe(".existing { color: black; }");
		expect(existing.hasAttribute("nonce")).toBe(false);
		expect(existing.nonce).toBe("");
	});

	it("keeps the active owner when shared created styles unload", () => {
		const first = useStyleTag(".shared { color: red; }", {
			document,
			id: "shared-style",
			manual: true,
		});
		const second = useStyleTag(".shared { color: blue; }", {
			document,
			id: "shared-style",
			manual: true,
		});

		first.load();
		second.load();
		first.css.value = ".shared { color: green; }";
		first.load();

		expect(styleTags()).toHaveLength(1);
		expect(styleTags()[0]?.textContent).toBe(".shared { color: blue; }");

		second.unload();

		expect(styleTags()).toHaveLength(1);
		expect(styleTags()[0]?.textContent).toBe(".shared { color: green; }");
		expect(first.isLoaded.value).toBe(true);

		first.unload();

		expect(styleTags()).toHaveLength(0);
	});

	it("does not remove shared created styles while another owner is active", () => {
		const first = useStyleTag(".shared { color: red; }", {
			document,
			id: "shared-created-style",
			manual: true,
		});
		const second = useStyleTag(".shared { color: blue; }", {
			document,
			id: "shared-created-style",
			manual: true,
		});

		first.load();
		second.load();
		first.unload();

		expect(styleTags()).toHaveLength(1);
		expect(styleTags()[0]?.textContent).toBe(".shared { color: blue; }");
		expect(second.isLoaded.value).toBe(true);

		second.unload();

		expect(styleTags()).toHaveLength(0);
	});

	it("restores original style after shared reused styles unload", () => {
		const existing = document.createElement("style");
		existing.id = "shared-existing-style";
		existing.media = "screen";
		existing.nonce = "existing-nonce";
		existing.textContent = ".existing { color: black; }";
		document.head.append(existing);
		const first = useStyleTag(".existing { color: red; }", {
			document,
			id: "shared-existing-style",
			manual: true,
			media: "print",
			nonce: "first-nonce",
		});
		const second = useStyleTag(".existing { color: blue; }", {
			document,
			id: "shared-existing-style",
			manual: true,
		});

		first.load();
		second.load();
		first.unload();

		expect(styleTags()).toEqual([existing]);
		expect(existing.textContent).toBe(".existing { color: blue; }");
		expect(existing.media).toBe("print");
		expect(existing.nonce).toBe("first-nonce");
		expect(second.isLoaded.value).toBe(true);

		second.unload();

		expect(styleTags()).toEqual([existing]);
		expect(existing.textContent).toBe(".existing { color: black; }");
		expect(existing.media).toBe("screen");
		expect(existing.nonce).toBe("existing-nonce");
	});

	it("does not use the global document when document is null", () => {
		const globalStyle = document.createElement("style");
		globalStyle.id = "global-style";
		document.head.append(globalStyle);
		const style = useStyleTag(".ssr { color: red; }", {
			document: null,
			manual: true,
		});

		style.load();
		style.unload();

		expect(style.isLoaded.value).toBe(false);
		expect(styleTags()).toEqual([globalStyle]);
	});

	it("loads when a requested document target becomes available", () => {
		const firstDocument = document.implementation.createHTMLDocument("first");
		const documentTarget = signal<UseStyleTagDocumentLike | null>(null);
		const style = useStyleTag(".late { color: red; }", {
			document: documentTarget,
			id: "late-style",
			manual: true,
		});

		style.load();

		expect(style.isLoaded.value).toBe(false);
		expect(styleTags(firstDocument)).toHaveLength(0);

		documentTarget.value = firstDocument;

		expect(style.isLoaded.value).toBe(true);
		expect(styleTags(firstDocument)).toHaveLength(1);
		expect(styleTags(firstDocument)[0]?.id).toBe("late-style");
		expect(styleTags(firstDocument)[0]?.textContent).toBe(
			".late { color: red; }",
		);
	});

	it("moves a created style when the document target changes", () => {
		const firstDocument = document.implementation.createHTMLDocument("first");
		const secondDocument = document.implementation.createHTMLDocument("second");
		const documentTarget = signal<UseStyleTagDocumentLike | null>(
			firstDocument,
		);
		const style = useStyleTag(".move { color: red; }", {
			document: documentTarget,
			id: "moving-style",
			manual: true,
		});

		style.load();
		documentTarget.value = secondDocument;

		expect(styleTags(firstDocument)).toHaveLength(0);
		expect(styleTags(secondDocument)).toHaveLength(1);
		expect(styleTags(secondDocument)[0]?.id).toBe("moving-style");
		expect(styleTags(secondDocument)[0]?.textContent).toBe(
			".move { color: red; }",
		);

		documentTarget.value = null;

		expect(styleTags(secondDocument)).toHaveLength(0);
		expect(style.isLoaded.value).toBe(false);
	});

	it("unloads created styles when the current scope is disposed", () => {
		const scope = createScope();
		const style = runWithScope(scope, () =>
			useStyleTag(".scoped { color: red; }", { document }),
		);

		expect(styleTags()).toHaveLength(1);
		expect(style.isLoaded.value).toBe(true);

		disposeScope(scope);

		expect(styleTags()).toHaveLength(0);
		expect(style.isLoaded.value).toBe(false);
	});

	it("loads on molecule mount and unloads on unmount", () => {
		const UseStyle = molecule(() =>
			useStyleTag(".mounted { color: red; }", { document }),
		);
		const style = UseStyle();

		expect(styleTags()).toHaveLength(0);

		mountMolecule(style);

		expect(styleTags()).toHaveLength(1);
		expect(style.isLoaded.value).toBe(true);

		unmountMolecule(style);

		expect(styleTags()).toHaveLength(0);
		expect(style.isLoaded.value).toBe(false);

		disposeMolecule(style);
	});
});
