// @vitest-environment node

import { createScope, disposeScope, runWithScope } from "@sigrea/core";
import { describe, expect, it } from "vitest";

import { createEvents } from "./index";

describe("createEvents", () => {
	it("sends events only to listeners for the matching type", async () => {
		const events = createEvents<{
			cleared: [];
			moved: [x: number, y: number];
			selected: [file: { readonly name: string }];
		}>();
		const calls: string[] = [];

		events.on("selected", (file) => {
			calls.push(`selected:${file.name}`);
			return file.name.toUpperCase();
		});
		events.on("cleared", () => {
			calls.push("cleared");
		});
		events.on("moved", (x, y) => {
			calls.push(`moved:${x}:${y}`);
		});

		await expect(events.send("selected", { name: "avatar.png" })).resolves.toBe(
			undefined,
		);
		await events.send("moved", 10, 20);

		expect(calls).toEqual(["selected:avatar.png", "moved:10:20"]);
	});

	it("removes listeners from the returned stop handle", async () => {
		const events = createEvents<{ changed: [value: number] }>();
		const calls: number[] = [];
		const stop = events.on("changed", (value) => {
			calls.push(value);
		});

		await events.send("changed", 1);
		stop();
		await events.send("changed", 2);

		expect(calls).toEqual([1]);
	});

	it("keeps stop handles idempotent", async () => {
		const events = createEvents<{ changed: [value: number] }>();
		const calls: number[] = [];
		const stop = events.on("changed", (value) => {
			calls.push(value);
		});

		stop();
		stop();
		await events.send("changed", 1);

		expect(calls).toEqual([]);
	});

	it("can subscribe again after stopping the last listener", async () => {
		const events = createEvents<{ changed: [value: number] }>();
		const calls: number[] = [];
		const stop = events.on("changed", (value) => {
			calls.push(value);
		});

		stop();
		events.on("changed", (value) => {
			calls.push(value + 10);
		});
		await events.send("changed", 3);

		expect(calls).toEqual([13]);
	});

	it("resolves sends without listeners and keeps later listeners usable", async () => {
		const events = createEvents<{ ready: [] }>();
		const calls: string[] = [];

		await expect(events.send("ready")).resolves.toBeUndefined();
		events.on("ready", () => calls.push("ready"));
		await events.send("ready");

		expect(calls).toEqual(["ready"]);
	});

	it("registers the same listener once for the same event", async () => {
		const events = createEvents<{
			primary: [value: number];
			secondary: [value: number];
		}>();
		const calls: string[] = [];
		const listener = (value: number) => {
			calls.push(`value:${value}`);
		};

		events.on("primary", listener);
		events.on("primary", listener);
		events.on("secondary", listener);

		await events.send("primary", 1);
		await events.send("secondary", 2);

		expect(calls).toEqual(["value:1", "value:2"]);
	});

	it("keeps duplicated listeners until every stop handle is called", async () => {
		const events = createEvents<{ changed: [value: number] }>();
		const calls: number[] = [];
		const listener = (value: number) => {
			calls.push(value);
		};

		const firstStop = events.on("changed", listener);
		const secondStop = events.on("changed", listener);

		await events.send("changed", 1);
		firstStop();
		firstStop();
		await events.send("changed", 2);
		secondStop();
		await events.send("changed", 3);

		expect(calls).toEqual([1, 2]);
	});

	it("removes scoped listeners when the scope is disposed", async () => {
		const events = createEvents<{ selected: [id: string] }>();
		const calls: string[] = [];
		const scope = createScope();

		runWithScope(scope, () => {
			events.on("selected", (id) => calls.push(id));
		});

		await events.send("selected", "a");
		disposeScope(scope);
		await events.send("selected", "b");

		expect(calls).toEqual(["a"]);
	});

	it("keeps outer duplicated listeners after scoped duplicates are disposed", async () => {
		const events = createEvents<{ selected: [id: string] }>();
		const calls: string[] = [];
		const listener = (id: string) => {
			calls.push(id);
		};
		const scope = createScope();

		events.on("selected", listener);
		runWithScope(scope, () => {
			events.on("selected", listener);
		});

		await events.send("selected", "a");
		disposeScope(scope);
		await events.send("selected", "b");

		expect(calls).toEqual(["a", "b"]);
	});

	it("keeps outer duplicated listeners after scoped stop and disposal", async () => {
		const events = createEvents<{ selected: [id: string] }>();
		const calls: string[] = [];
		const listener = (id: string) => {
			calls.push(id);
		};
		const scope = createScope();
		let scopedStop: (() => void) | undefined;

		events.on("selected", listener);
		runWithScope(scope, () => {
			scopedStop = events.on("selected", listener);
		});

		await events.send("selected", "a");
		if (scopedStop === undefined) {
			throw new Error("scoped listener was not registered");
		}
		scopedStop();
		disposeScope(scope);
		await events.send("selected", "b");

		expect(calls).toEqual(["a", "b"]);
	});

	it("keeps outer duplicated listeners after scoped disposal and stop", async () => {
		const events = createEvents<{ selected: [id: string] }>();
		const calls: string[] = [];
		const listener = (id: string) => {
			calls.push(id);
		};
		const scope = createScope();
		let scopedStop: (() => void) | undefined;

		events.on("selected", listener);
		runWithScope(scope, () => {
			scopedStop = events.on("selected", listener);
		});

		await events.send("selected", "a");
		disposeScope(scope);
		if (scopedStop === undefined) {
			throw new Error("scoped listener was not registered");
		}
		scopedStop();
		await events.send("selected", "b");

		expect(calls).toEqual(["a", "b"]);
	});

	it("keeps outer duplicated listeners when the scoped duplicate was first", async () => {
		const events = createEvents<{ selected: [id: string] }>();
		const calls: string[] = [];
		const listener = (id: string) => {
			calls.push(id);
		};
		const scope = createScope();

		runWithScope(scope, () => {
			events.on("selected", listener);
		});
		events.on("selected", listener);

		await events.send("selected", "a");
		disposeScope(scope);
		await events.send("selected", "b");

		expect(calls).toEqual(["a", "b"]);
	});

	it("can subscribe again after the scoped listener is disposed", async () => {
		const events = createEvents<{ selected: [id: string] }>();
		const calls: string[] = [];
		const scope = createScope();

		runWithScope(scope, () => {
			events.on("selected", (id) => calls.push(id));
		});

		disposeScope(scope);
		events.on("selected", (id) => calls.push(`next:${id}`));
		await events.send("selected", "c");

		expect(calls).toEqual(["next:c"]);
	});

	it("rejects when an async listener rejects", async () => {
		const events = createEvents<{ failed: [] }>();

		events.on("failed", async () => {
			throw new Error("failed");
		});

		await expect(events.send("failed")).rejects.toThrow("failed");
	});

	it("rejects when a listener throws before returning", async () => {
		const events = createEvents<{ failed: [] }>();

		events.on("failed", () => {
			throw new Error("failed");
		});

		await expect(events.send("failed")).rejects.toThrow("failed");
	});

	it("still calls later listeners when an earlier listener throws", async () => {
		const events = createEvents<{ failed: [] }>();
		const calls: string[] = [];

		events.on("failed", () => {
			calls.push("first");
			throw new Error("failed");
		});
		events.on("failed", () => {
			calls.push("second");
		});

		await expect(events.send("failed")).rejects.toThrow("failed");

		expect(calls).toEqual(["first", "second"]);
	});
});
