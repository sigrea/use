import { disposeTrackedMolecules, signal } from "@sigrea/core";
import { afterEach, describe, expect, it } from "vitest";

import type { UseFaviconDocumentLike } from "../types";
import { useFavicon } from "./index";

function iconLinks(documentTarget = document): HTMLLinkElement[] {
	return Array.from(
		documentTarget.head.querySelectorAll<HTMLLinkElement>("link[rel]"),
	);
}

describe("useFavicon", () => {
	afterEach(() => {
		document.head.innerHTML = "";
		disposeTrackedMolecules();
	});

	it("reads an existing favicon without touching unrelated rel values", () => {
		const stylesheet = document.createElement("link");
		stylesheet.rel = "stylesheet";
		stylesheet.setAttribute("href", "/app.css");
		const apple = document.createElement("link");
		apple.rel = "apple-touch-icon";
		apple.setAttribute("href", "/apple.png");
		const first = document.createElement("link");
		first.rel = "shortcut icon";
		first.setAttribute("href", "/favicon.ico");
		first.type = "image/x-icon";
		const second = document.createElement("link");
		second.rel = "icon";
		second.setAttribute("href", "/secondary.ico");
		document.head.append(stylesheet, apple, first, second);

		const favicon = useFavicon();

		expect(favicon.value).toBe("/favicon.ico");
		expect(apple.getAttribute("href")).toBe("/apple.png");
		expect(second.getAttribute("href")).toBe("/secondary.ico");

		favicon.value = "/next.png";

		expect(first.getAttribute("href")).toBe("/next.png");
		expect(second.getAttribute("href")).toBe("/next.png");
		expect(first.rel).toBe("shortcut icon");
		expect(second.rel).toBe("icon");
		expect(first.type).toBe("image/x-icon");
		expect(apple.getAttribute("href")).toBe("/apple.png");

		favicon.stop();
		favicon.value = "/ignored.png";

		expect(first.getAttribute("href")).toBe("/next.png");
		expect(second.getAttribute("href")).toBe("/next.png");
	});

	it("matches rel tokens case-insensitively", () => {
		const link = document.createElement("link");
		link.setAttribute("rel", "Shortcut Icon");
		link.setAttribute("href", "/favicon.ico");
		document.head.append(link);

		const favicon = useFavicon(undefined, { document });

		expect(favicon.value).toBe("/favicon.ico");

		favicon.value = "/next.ico";

		expect(iconLinks()).toHaveLength(1);
		expect(link.getAttribute("href")).toBe("/next.ico");
		expect(link.getAttribute("rel")).toBe("Shortcut Icon");

		favicon.value = null;

		expect(link.getAttribute("href")).toBe("/favicon.ico");
		expect(link.getAttribute("rel")).toBe("Shortcut Icon");

		favicon.stop();
	});

	it("starts with null when no favicon source or link exists", () => {
		const favicon = useFavicon(undefined, { document });

		expect(favicon.value).toBeNull();
		expect(iconLinks()).toHaveLength(0);

		favicon.stop();
	});

	it("creates and removes a link for string and null values", () => {
		const favicon = useFavicon("light.svg", {
			baseUrl: "/icons/",
			document,
			media: "(prefers-color-scheme: light)",
			rel: "icon",
			sizes: "any",
		});
		const link = iconLinks()[0];

		expect(link?.rel).toBe("icon");
		expect(link?.getAttribute("href")).toBe("/icons/light.svg");
		expect(link?.getAttribute("sizes")).toBe("any");
		expect(link?.media).toBe("(prefers-color-scheme: light)");
		expect(link?.getAttribute("type")).toBeNull();

		favicon.value = null;

		expect(iconLinks()).toHaveLength(0);
		expect(favicon.value).toBeNull();

		favicon.stop();
	});

	it("tracks a signal source", () => {
		const source = signal<string | null>("one.png");
		const favicon = useFavicon(source, { document });

		expect(iconLinks()[0]?.getAttribute("href")).toBe("one.png");

		source.value = "two.ico";

		expect(favicon.value).toBe("two.ico");
		expect(iconLinks()).toHaveLength(1);
		expect(iconLinks()[0]?.getAttribute("href")).toBe("two.ico");
		expect(iconLinks()[0]?.getAttribute("type")).toBeNull();

		source.value = null;

		expect(iconLinks()).toHaveLength(0);
		expect(favicon.value).toBeNull();

		favicon.stop();
	});

	it("restores existing link attributes when the value becomes nullish", () => {
		const first = document.createElement("link");
		first.rel = "icon";
		first.setAttribute("href", "/first.ico");
		first.setAttribute("sizes", "32x32");
		first.type = "image/x-icon";
		const second = document.createElement("link");
		second.rel = "shortcut icon";
		second.setAttribute("href", "/second.ico");
		second.setAttribute("sizes", "16x16");
		second.type = "image/x-icon";
		document.head.append(first, second);

		const favicon = useFavicon("next.png", {
			document,
			sizes: "any",
			type: "image/png",
		});

		expect(first.getAttribute("href")).toBe("next.png");
		expect(second.getAttribute("href")).toBe("next.png");
		expect(first.type).toBe("image/png");
		expect(second.type).toBe("image/png");
		expect(first.getAttribute("sizes")).toBe("any");
		expect(second.getAttribute("sizes")).toBe("any");

		favicon.value = undefined;

		expect(iconLinks()).toHaveLength(2);
		expect(first.getAttribute("href")).toBe("/first.ico");
		expect(second.getAttribute("href")).toBe("/second.ico");
		expect(first.rel).toBe("icon");
		expect(second.rel).toBe("shortcut icon");
		expect(first.type).toBe("image/x-icon");
		expect(second.type).toBe("image/x-icon");
		expect(first.getAttribute("sizes")).toBe("32x32");
		expect(second.getAttribute("sizes")).toBe("16x16");

		favicon.stop();
	});

	it("stops future DOM updates without restoring the current favicon", () => {
		const source = signal("next.png");
		const link = document.createElement("link");
		link.rel = "icon";
		link.setAttribute("href", "/first.ico");
		document.head.append(link);
		const favicon = useFavicon(source, { document });

		expect(link.getAttribute("href")).toBe("next.png");

		favicon.stop();
		source.value = "source-ignored.png";
		favicon.value = "setter-ignored.png";

		expect(favicon.value).toBe("setter-ignored.png");
		expect(link.getAttribute("href")).toBe("next.png");
	});

	it("uses a custom rel and type", () => {
		const icon = document.createElement("link");
		icon.rel = "icon";
		icon.setAttribute("href", "/favicon.ico");
		document.head.append(icon);
		const favicon = useFavicon("apple.png", {
			document,
			rel: "apple-touch-icon",
			type: "image/png",
		});
		const apple = iconLinks().find((link) => link.rel === "apple-touch-icon");

		expect(icon.getAttribute("href")).toBe("/favicon.ico");
		expect(apple?.getAttribute("href")).toBe("apple.png");
		expect(apple?.type).toBe("image/png");

		favicon.stop();
	});

	it("updates only links that match the configured media", () => {
		const light = document.createElement("link");
		light.rel = "icon";
		light.setAttribute("href", "/light.ico");
		light.media = "(prefers-color-scheme: light)";
		const dark = document.createElement("link");
		dark.rel = "icon";
		dark.setAttribute("href", "/dark.ico");
		dark.media = "(prefers-color-scheme: dark)";
		document.head.append(light, dark);

		const favicon = useFavicon("dark.svg", {
			document,
			media: "(prefers-color-scheme: dark)",
			type: "image/svg+xml",
		});

		expect(light.getAttribute("href")).toBe("/light.ico");
		expect(dark.getAttribute("href")).toBe("dark.svg");
		expect(dark.type).toBe("image/svg+xml");

		favicon.value = null;

		expect(light.getAttribute("href")).toBe("/light.ico");
		expect(dark.getAttribute("href")).toBe("/dark.ico");
		expect(dark.getAttribute("type")).toBeNull();

		favicon.stop();
	});

	it("does not use the global document when document is null", () => {
		const globalIcon = document.createElement("link");
		globalIcon.rel = "icon";
		globalIcon.setAttribute("href", "/global.ico");
		document.head.append(globalIcon);
		const favicon = useFavicon("ignored.png", { document: null });

		expect(favicon.value).toBe("ignored.png");
		expect(iconLinks()).toHaveLength(1);
		expect(globalIcon.getAttribute("href")).toBe("/global.ico");

		favicon.value = "still-ignored.png";
		expect(globalIcon.getAttribute("href")).toBe("/global.ico");

		favicon.stop();
	});

	it("moves the managed favicon when the document changes", () => {
		const firstDocument = document.implementation.createHTMLDocument("first");
		const secondDocument = document.implementation.createHTMLDocument("second");
		const documentTarget = signal<UseFaviconDocumentLike | null>(firstDocument);
		const favicon = useFavicon("one.png", { document: documentTarget });

		expect(iconLinks(firstDocument)[0]?.getAttribute("href")).toBe("one.png");

		documentTarget.value = secondDocument;

		expect(iconLinks(firstDocument)).toHaveLength(0);
		expect(iconLinks(secondDocument)[0]?.getAttribute("href")).toBe("one.png");

		favicon.stop();
		favicon.value = "two.png";

		expect(iconLinks(secondDocument)[0]?.getAttribute("href")).toBe("one.png");
	});
});
