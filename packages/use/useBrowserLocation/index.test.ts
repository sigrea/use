import { signal } from "@sigrea/core";
import { describe, expect, it } from "vitest";

import type { BrowserLocationLike, BrowserLocationWindowLike } from "../types";
import { useBrowserLocation } from "./index";

class FakeWindow extends EventTarget implements BrowserLocationWindowLike {
	constructor(
		public location?: BrowserLocationLike,
		public history?: { readonly state?: unknown; readonly length?: number },
	) {
		super();
	}
}

function createLocation(
	values: Partial<BrowserLocationLike> = {},
): BrowserLocationLike {
	return {
		hash: "",
		host: "example.com",
		hostname: "example.com",
		href: "https://example.com/",
		origin: "https://example.com",
		pathname: "/",
		port: "",
		protocol: "https:",
		search: "",
		...values,
	};
}

function createWindow(
	values: Partial<{
		location: BrowserLocationLike;
		history: { readonly state?: unknown; readonly length?: number };
	}> = {},
): FakeWindow {
	return new FakeWindow(
		values.location ?? createLocation(),
		values.history ?? { state: undefined, length: 1 },
	);
}

describe("useBrowserLocation", () => {
	it("uses fallback values without a window", () => {
		const result = useBrowserLocation({ window: null });

		expect(result.trigger.value).toBe("load");
		expect(result.state.value).toBeUndefined();
		expect(result.length.value).toBeUndefined();
		expect(result.origin.value).toBeUndefined();
		expect(result.href.value).toBeUndefined();

		result.hash.value = "#local";
		expect(result.hash.value).toBe("#local");
		result.stop();
	});

	it("reads the initial location and history", () => {
		const windowTarget = createWindow({
			location: createLocation({
				hash: "#start",
				href: "https://example.com/start?mode=1#start",
				pathname: "/start",
				search: "?mode=1",
			}),
			history: { state: { page: "start" }, length: 3 },
		});
		const result = useBrowserLocation({ window: windowTarget });

		expect(result.trigger.value).toBe("load");
		expect(result.state.value).toEqual({ page: "start" });
		expect(result.length.value).toBe(3);
		expect(result.origin.value).toBe("https://example.com");
		expect(result.hash.value).toBe("#start");
		expect(result.pathname.value).toBe("/start");
		expect(result.search.value).toBe("?mode=1");
		result.stop();
	});

	it("updates values on popstate", () => {
		const windowTarget = createWindow();
		const result = useBrowserLocation({ window: windowTarget });

		windowTarget.location = createLocation({
			href: "https://example.com/next",
			pathname: "/next",
		});
		windowTarget.history = { state: { page: "next" }, length: 4 };
		windowTarget.dispatchEvent(new Event("popstate"));

		expect(result.trigger.value).toBe("popstate");
		expect(result.state.value).toEqual({ page: "next" });
		expect(result.length.value).toBe(4);
		expect(result.href.value).toBe("https://example.com/next");
		expect(result.pathname.value).toBe("/next");
		result.stop();
	});

	it("updates the hash on hashchange", () => {
		const windowTarget = createWindow();
		const result = useBrowserLocation({ window: windowTarget });

		windowTarget.location = createLocation({
			hash: "#details",
			href: "https://example.com/#details",
		});
		windowTarget.dispatchEvent(new Event("hashchange"));

		expect(result.trigger.value).toBe("hashchange");
		expect(result.hash.value).toBe("#details");
		expect(result.href.value).toBe("https://example.com/#details");
		result.stop();
	});

	it("writes location fields through writable computed values", () => {
		const windowTarget = createWindow();
		const result = useBrowserLocation({ window: windowTarget });

		result.hash.value = "#next";
		result.search.value = "?q=sigrea";

		expect(windowTarget.location?.hash).toBe("#next");
		expect(windowTarget.location?.search).toBe("?q=sigrea");
		expect(result.hash.value).toBe("#next");
		expect(result.search.value).toBe("?q=sigrea");
		expect(result.trigger.value).toBe("load");
		result.stop();
	});

	it("cleans up listeners when the window target changes", () => {
		const first = createWindow({
			location: createLocation({ hash: "#first" }),
		});
		const second = createWindow({
			location: createLocation({ hash: "#second" }),
		});
		const windowTarget = signal<BrowserLocationWindowLike | undefined>(first);
		const result = useBrowserLocation({ window: windowTarget });

		expect(result.hash.value).toBe("#first");

		windowTarget.value = second;
		expect(result.hash.value).toBe("#second");

		first.location = createLocation({ hash: "#old" });
		first.dispatchEvent(new Event("hashchange"));
		expect(result.hash.value).toBe("#second");

		second.location = createLocation({ hash: "#new" });
		second.dispatchEvent(new Event("hashchange"));
		expect(result.hash.value).toBe("#new");
		result.stop();
	});

	it("stops listening to browser events", () => {
		const windowTarget = createWindow({
			location: createLocation({ hash: "#active" }),
		});
		const result = useBrowserLocation({ window: windowTarget });

		result.stop();
		windowTarget.location = createLocation({ hash: "#stopped" });
		windowTarget.dispatchEvent(new Event("hashchange"));

		expect(result.hash.value).toBe("#active");
	});
});
