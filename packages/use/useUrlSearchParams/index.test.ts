// @vitest-environment node

import {
	createScope,
	disposeScope,
	nextTick,
	runWithScope,
	signal,
} from "@sigrea/core";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type {
	UrlParams,
	UseUrlSearchParamsHistoryLike,
	UseUrlSearchParamsLocationLike,
	UseUrlSearchParamsMode,
	UseUrlSearchParamsWindowLike,
} from "../types";
import { useUrlSearchParams } from "./index";

class FakeWindow extends EventTarget implements UseUrlSearchParamsWindowLike {
	readonly document = {
		title: "",
	} as Document & { title: string };
	readonly history: UseUrlSearchParamsHistoryLike;
	readonly location: UseUrlSearchParamsLocationLike = {
		hash: "",
		pathname: "/",
		search: "",
	};
	readonly writtenUrls: string[] = [];

	readonly replaceState = vi.fn(
		(_state: unknown, _title: string, url?: string | URL | null) => {
			this.writtenUrls.push(String(url ?? ""));
		},
	);
	readonly pushState = vi.fn(
		(_state: unknown, _title: string, url?: string | URL | null) => {
			this.writtenUrls.push(String(url ?? ""));
		},
	);

	constructor() {
		super();
		this.history = {
			state: null,
			replaceState: this.replaceState,
			pushState: this.pushState,
		};
	}

	popstate(search: string, hash: string): void {
		this.location.search = search;
		this.location.hash = hash;
		this.dispatchEvent(new Event("popstate"));
	}

	hashchange(search: string, hash: string): void {
		this.location.search = search;
		this.location.hash = hash;
		this.dispatchEvent(new Event("hashchange"));
	}
}

function setModeParam(
	window: FakeWindow,
	mode: UseUrlSearchParamsMode,
	value: string,
): void {
	if (mode === "history") {
		window.location.search = value;
	} else {
		window.location.hash = value;
	}
}

function popModeParam(
	window: FakeWindow,
	mode: UseUrlSearchParamsMode,
	value: string,
): void {
	if (mode === "history") {
		window.popstate(value, "");
	} else {
		window.popstate("", value);
	}
}

function expectedUrl(mode: UseUrlSearchParamsMode, query: string): string {
	if (mode === "history") {
		return query ? `/?${query}` : "/";
	}

	if (mode === "hash") {
		return query ? `/#?${query}` : "/#";
	}

	return query ? `/#${query}` : "/";
}

describe("useUrlSearchParams", () => {
	let window: FakeWindow;

	beforeEach(() => {
		window = new FakeWindow();
	});

	for (const mode of ["history", "hash", "hash-params"] as const) {
		describe(`${mode} mode`, () => {
			it("reads initial params and initialValue", () => {
				setModeParam(
					window,
					mode,
					mode === "history"
						? "?foo=bar"
						: mode === "hash"
							? "#/test/?foo=bar"
							: "#foo=bar",
				);

				const params = useUrlSearchParams(mode, { window });
				const initial = useUrlSearchParams(mode, {
					initialValue: { bar: "foo" },
					window: null,
				});

				expect(params.foo).toBe("bar");
				expect(initial.bar).toBe("foo");
			});

			it("updates params on popstate and hashchange when write is enabled", async () => {
				const params = useUrlSearchParams(mode, { window });
				expect(params.foo).toBeUndefined();

				popModeParam(
					window,
					mode,
					mode === "history"
						? "?foo=bar"
						: mode === "hash"
							? "#/test/?foo=bar"
							: "#foo=bar",
				);
				await nextTick();
				expect(params.foo).toBe("bar");

				popModeParam(
					window,
					mode,
					mode === "history"
						? "?foo=bar1&foo=bar2"
						: mode === "hash"
							? "#/test/?foo=bar1&foo=bar2"
							: "#foo=bar1&foo=bar2",
				);
				await nextTick();
				expect(params.foo).toEqual(["bar1", "bar2"]);

				if (mode !== "history") {
					window.hashchange(
						"",
						mode === "hash" ? "#/test/?foo=baz" : "#foo=baz",
					);
					await nextTick();
					expect(params.foo).toBe("baz");
				}
			});

			it("does not write browser history when write is false", async () => {
				const params = useUrlSearchParams(mode, { window, write: false });

				params.foo = "local";
				await nextTick();
				expect(window.replaceState).not.toHaveBeenCalled();
				expect(window.pushState).not.toHaveBeenCalled();

				popModeParam(
					window,
					mode,
					mode === "history"
						? "?foo=bar"
						: mode === "hash"
							? "#/test/?foo=bar"
							: "#foo=bar",
				);
				await nextTick();

				expect(params.foo).toBe("bar");
			});

			it("writes scalar, array, deleted, and custom-stringified params", async () => {
				const params = useUrlSearchParams(mode, {
					stringify: (params) => params.toString().replace(/=(&|$)/g, "$1"),
					window,
				});

				params.foo = "bar";
				await nextTick();
				expect(window.replaceState).toHaveBeenLastCalledWith(
					null,
					"",
					expectedUrl(mode, "foo=bar"),
				);

				params.foo = ["bar1", "bar2"];
				await nextTick();
				expect(window.replaceState).toHaveBeenLastCalledWith(
					null,
					"",
					expectedUrl(mode, "foo=bar1&foo=bar2"),
				);

				if (mode === "hash") {
					window.location.hash = "#?foo=bar1&foo=bar2";
				}
				Reflect.deleteProperty(params, "foo");
				await nextTick();
				expect(window.replaceState).toHaveBeenLastCalledWith(
					null,
					"",
					expectedUrl(mode, ""),
				);

				params.foo = "";
				params.bar = "";
				await nextTick();
				expect(window.replaceState).toHaveBeenLastCalledWith(
					null,
					"",
					expectedUrl(mode, "foo&bar"),
				);
			});

			it("supports push writeMode and preserves history state from events", async () => {
				const params = useUrlSearchParams(mode, {
					window,
					writeMode: "push",
				});

				params.foo = "first";
				await nextTick();
				params.bar = "second";
				await nextTick();

				expect(window.pushState).toHaveBeenLastCalledWith(
					null,
					"",
					expectedUrl(mode, "foo=first&bar=second"),
				);
				expect(window.replaceState).not.toHaveBeenCalled();

				popModeParam(
					window,
					mode,
					mode === "history"
						? "?foo=first"
						: mode === "hash"
							? "#/test/?foo=first"
							: "#foo=first",
				);
				await nextTick();

				expect(params.foo).toBe("first");
				expect(params.bar).toBeUndefined();
				expect(window.pushState).toHaveBeenCalledTimes(2);
			});

			it("removes nullish and falsy values from the URL only", async () => {
				const params = useUrlSearchParams<{
					bar: boolean | string;
					foo: null | string;
				}>(mode, {
					initialValue: {
						bar: "foo",
						foo: "bar",
					},
					removeFalsyValues: true,
					removeNullishValues: true,
					window,
				});

				params.foo = null;
				params.bar = false;
				await nextTick();

				expect(params.foo).toBeNull();
				expect(params.bar).toBe(false);
				expect(window.replaceState).toHaveBeenLastCalledWith(
					null,
					"",
					expectedUrl(mode, ""),
				);
			});
		});
	}

	it("cleans up listeners on scope disposal", async () => {
		const scope = createScope();
		let params!: UrlParams;

		runWithScope(scope, () => {
			params = useUrlSearchParams("history", { window });
		});
		disposeScope(scope);

		window.popstate("?foo=bar", "");
		await nextTick();

		expect(params.foo).toBeUndefined();
	});

	it("starts syncing when a deferred window target becomes available", async () => {
		const windowTarget = signal<FakeWindow | null>(null);
		const params = useUrlSearchParams("history", {
			initialValue: { foo: "local" },
			window: windowTarget,
		});

		expect(params.foo).toBe("local");

		window.location.search = "?foo=bar";
		windowTarget.value = window;

		expect(params.foo).toBe("bar");

		window.popstate("?foo=baz", "");
		await nextTick();

		expect(params.foo).toBe("baz");

		params.foo = "qux";
		await nextTick();

		expect(window.replaceState).toHaveBeenLastCalledWith(null, "", "/?foo=qux");
	});

	it("retargets deferred window listeners", async () => {
		const firstWindow = new FakeWindow();
		const secondWindow = new FakeWindow();
		const windowTarget = signal<FakeWindow | null>(null);
		const params = useUrlSearchParams("hash", {
			initialValue: { foo: "local" },
			window: windowTarget,
		});

		firstWindow.location.hash = "#/test/?foo=first";
		windowTarget.value = firstWindow;
		expect(params.foo).toBe("first");

		secondWindow.location.hash = "#/test/?foo=second";
		windowTarget.value = secondWindow;
		expect(params.foo).toBe("second");

		firstWindow.hashchange("", "#/test/?foo=stale");
		await nextTick();
		expect(params.foo).toBe("second");

		secondWindow.hashchange("", "#/test/?foo=active");
		await nextTick();
		expect(params.foo).toBe("active");

		windowTarget.value = null;
		expect(params.foo).toBe("local");
	});
});
