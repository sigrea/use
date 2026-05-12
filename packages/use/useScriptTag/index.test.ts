import {
	createScope,
	disposeScope,
	disposeTrackedMolecules,
	runWithScope,
	signal,
} from "@sigrea/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useScriptTag } from "./index";

function scriptTags(documentTarget = document): HTMLScriptElement[] {
	return Array.from(
		documentTarget.head.querySelectorAll<HTMLScriptElement>("script[src]"),
	);
}

describe("useScriptTag", () => {
	afterEach(() => {
		document.head.innerHTML = "";
		disposeTrackedMolecules();
	});

	it("loads a script immediately and applies script options", () => {
		const onLoaded = vi.fn();
		const result = useScriptTag("/sdk.js", onLoaded, {
			async: false,
			attrs: {
				"data-sdk": "analytics",
				integrity: "sha384-test",
			},
			crossOrigin: "",
			defer: true,
			document,
			noModule: true,
			nonce: "nonce-value",
			referrerPolicy: "no-referrer",
			type: "module",
		});
		const script = scriptTags()[0];

		expect(script).toBeInstanceOf(HTMLScriptElement);
		expect(script?.getAttribute("src")).toBe("/sdk.js");
		expect(script?.type).toBe("module");
		expect(script?.async).toBe(false);
		expect(script?.defer).toBe(true);
		expect(script?.crossOrigin).toBe("");
		expect(script?.noModule).toBe(true);
		expect(script?.nonce).toBe("nonce-value");
		expect(script?.referrerPolicy).toBe("no-referrer");
		expect(script?.getAttribute("data-sdk")).toBe("analytics");
		expect(script?.getAttribute("integrity")).toBe("sha384-test");
		expect(result.scriptTag.value).toBeNull();

		script.dispatchEvent(new Event("load"));

		expect(script.getAttribute("data-loaded")).toBe("true");
		expect(onLoaded).toHaveBeenCalledWith(script);
		expect(result.scriptTag.value).toBe(script);
	});

	it("resolves immediately when waitForScriptLoad is false and still handles load later", async () => {
		const onLoaded = vi.fn();
		const result = useScriptTag("/manual.js", onLoaded, {
			document,
			manual: true,
		});

		const loaded = await result.load(false);
		const script = scriptTags()[0];

		expect(loaded).toBe(script);
		expect(result.scriptTag.value).toBe(script);
		expect(script?.getAttribute("data-loaded")).toBeNull();

		script.dispatchEvent(new Event("load"));

		expect(script.getAttribute("data-loaded")).toBe("true");
		expect(onLoaded).toHaveBeenCalledWith(script);
		expect(result.scriptTag.value).toBe(script);
	});

	it("reuses an existing loaded script without removing it on unload", async () => {
		const existing = document.createElement("script");
		existing.setAttribute("src", "/existing.js");
		existing.setAttribute("data-loaded", "true");
		document.head.append(existing);
		const onLoaded = vi.fn();
		const result = useScriptTag("/existing.js", onLoaded, {
			document,
			manual: true,
		});

		await expect(result.load()).resolves.toBe(existing);

		expect(scriptTags()).toEqual([existing]);
		expect(result.scriptTag.value).toBe(existing);
		expect(onLoaded).not.toHaveBeenCalled();

		result.unload();

		expect(scriptTags()).toEqual([existing]);
		expect(result.scriptTag.value).toBeNull();
	});

	it("rejects on error and abort events", async () => {
		const errored = useScriptTag("/error.js", undefined, {
			document,
			manual: true,
		});
		const errorPromise = errored.load();
		const errorScript = scriptTags()[0];
		const errorEvent = new Event("error");

		errorScript.dispatchEvent(errorEvent);

		await expect(errorPromise).rejects.toBe(errorEvent);
		expect(errored.scriptTag.value).toBeNull();

		const aborted = useScriptTag("/abort.js", undefined, {
			document,
			manual: true,
		});
		const abortPromise = aborted.load();
		const abortScript = scriptTags()[1];
		const abortEvent = new Event("abort");

		abortScript.dispatchEvent(abortEvent);

		await expect(abortPromise).rejects.toBe(abortEvent);
		expect(aborted.scriptTag.value).toBeNull();
	});

	it("returns false when document is unavailable", async () => {
		const result = useScriptTag("/ssr.js", undefined, {
			document: null,
			manual: true,
		});

		await expect(result.load()).resolves.toBe(false);
		expect(result.scriptTag.value).toBeNull();
		expect(scriptTags()).toHaveLength(0);

		result.unload();

		expect(result.scriptTag.value).toBeNull();
		expect(scriptTags()).toHaveLength(0);
	});

	it("uses the latest source for later load calls and settles the replaced promise", async () => {
		const source = signal("/one.js");
		const onLoaded = vi.fn();
		const result = useScriptTag(source, onLoaded, {
			document,
			manual: true,
		});
		const firstPromise = result.load();
		const firstScript = scriptTags()[0];

		source.value = "/two.js";

		const secondScript = await result.load(false);

		await expect(firstPromise).resolves.toBe(false);
		expect(firstScript.isConnected).toBe(false);
		expect((secondScript as HTMLScriptElement).getAttribute("src")).toBe(
			"/two.js",
		);

		firstScript.dispatchEvent(new Event("load"));
		expect(onLoaded).not.toHaveBeenCalled();

		(secondScript as HTMLScriptElement).dispatchEvent(new Event("load"));
		expect(onLoaded).toHaveBeenCalledWith(secondScript);
		expect(result.scriptTag.value).toBe(secondScript);
	});

	it("removes a loaded script when the source changes before loading again", async () => {
		const source = signal("/loaded-one.js");
		const result = useScriptTag(source, undefined, {
			document,
			manual: true,
		});
		const firstScript = await result.load(false);

		(firstScript as HTMLScriptElement).dispatchEvent(new Event("load"));
		source.value = "/loaded-two.js";
		const secondScript = await result.load(false);

		expect((firstScript as HTMLScriptElement).isConnected).toBe(false);
		expect((secondScript as HTMLScriptElement).getAttribute("src")).toBe(
			"/loaded-two.js",
		);
		expect(scriptTags().map((script) => script.getAttribute("src"))).toEqual([
			"/loaded-two.js",
		]);
	});

	it("removes created scripts when the document target becomes unavailable", async () => {
		const documentTarget = signal<Document | null>(document);
		const result = useScriptTag("/dynamic-document.js", undefined, {
			document: documentTarget,
			manual: true,
		});
		const script = await result.load(false);

		documentTarget.value = null;
		result.unload();

		expect((script as HTMLScriptElement).isConnected).toBe(false);
		expect(scriptTags()).toHaveLength(0);
		expect(result.scriptTag.value).toBeNull();
	});

	it("removes an active script when the document target becomes unavailable", async () => {
		const documentTarget = signal<Document | null>(document);
		const onLoaded = vi.fn();
		const result = useScriptTag("/dynamic-active-document.js", onLoaded, {
			document: documentTarget,
			manual: true,
		});
		const firstPromise = result.load();
		const script = scriptTags()[0];

		documentTarget.value = null;
		await expect(result.load()).resolves.toBe(false);
		await expect(firstPromise).resolves.toBe(false);

		expect(script.isConnected).toBe(false);
		expect(scriptTags()).toHaveLength(0);

		script.dispatchEvent(new Event("load"));
		expect(onLoaded).not.toHaveBeenCalled();
	});

	it("removes created scripts and listeners on unload", async () => {
		const onLoaded = vi.fn();
		const result = useScriptTag("/temporary.js", onLoaded, {
			document,
			manual: true,
		});
		const script = await result.load(false);

		result.unload();

		expect(scriptTags()).toHaveLength(0);
		expect(result.scriptTag.value).toBeNull();

		(script as HTMLScriptElement).dispatchEvent(new Event("load"));

		expect(onLoaded).not.toHaveBeenCalled();
		expect(
			(script as HTMLScriptElement).getAttribute("data-loaded"),
		).toBeNull();
	});

	it("unloads created scripts when the current scope is disposed", () => {
		const scope = createScope();
		const result = runWithScope(scope, () =>
			useScriptTag("/scoped.js", undefined, { document }),
		);
		const script = scriptTags()[0];

		expect(script).toBeInstanceOf(HTMLScriptElement);

		disposeScope(scope);

		expect(scriptTags()).toHaveLength(0);
		expect(result.scriptTag.value).toBeNull();
	});
});
