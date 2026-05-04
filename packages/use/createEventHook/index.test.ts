// @vitest-environment node

import { createScope, disposeScope, runWithScope } from "@sigrea/core";
import { describe, expect, it } from "vitest";

import { createEventHook } from "./index";

describe("createEventHook", () => {
	it("triggers listeners in registration order and resolves their return values", async () => {
		const hook = createEventHook<number>();
		const calls: number[] = [];

		hook.on((value) => {
			calls.push(value);
			return value * 2;
		});
		hook.on((value) => {
			calls.push(value + 1);
			return value * 3;
		});

		await expect(hook.trigger(2)).resolves.toEqual([4, 6]);
		expect(calls).toEqual([2, 3]);
	});

	it("supports async listeners", async () => {
		const hook = createEventHook<string>();

		hook.on(async (value) => {
			return value.toUpperCase();
		});

		await expect(hook.trigger("ready")).resolves.toEqual(["READY"]);
	});

	it("rejects when an async listener rejects", async () => {
		const hook = createEventHook<string>();

		hook.on(async () => {
			throw new Error("failed");
		});

		await expect(hook.trigger("ready")).rejects.toThrow("failed");
	});

	it("throws when a listener throws before returning", () => {
		const hook = createEventHook<string>();

		hook.on(() => {
			throw new Error("failed");
		});

		expect(() => hook.trigger("ready")).toThrow("failed");
	});

	it("registers the same listener once", async () => {
		const hook = createEventHook<number>();
		const calls: number[] = [];
		const listener = (value: number) => {
			calls.push(value);
		};

		hook.on(listener);
		hook.on(listener);
		await hook.trigger(1);

		expect(calls).toEqual([1]);
	});

	it("removes a listener from the returned off handle", async () => {
		const hook = createEventHook<number>();
		const calls: number[] = [];
		const listener = (value: number) => {
			calls.push(value);
		};
		const { off } = hook.on(listener);

		await hook.trigger(1);
		off();
		await hook.trigger(2);

		expect(calls).toEqual([1]);
	});

	it("removes a listener from off", async () => {
		const hook = createEventHook<number>();
		const calls: number[] = [];
		const listener = (value: number) => {
			calls.push(value);
		};

		hook.on(listener);
		hook.off(listener);
		await hook.trigger(1);

		expect(calls).toEqual([]);
	});

	it("clears all listeners", async () => {
		const hook = createEventHook<number>();
		const calls: number[] = [];

		hook.on((value) => calls.push(value));
		hook.on((value) => calls.push(value + 1));
		hook.clear();

		await hook.trigger(1);
		hook.on((value) => calls.push(value + 2));
		await hook.trigger(2);

		expect(calls).toEqual([4]);
	});

	it("uses the listener set snapshot for each trigger", async () => {
		const hook = createEventHook<number>();
		const calls: number[] = [];
		const second = (value: number) => {
			calls.push(value + 1);
		};
		const first = (value: number) => {
			calls.push(value);
			hook.off(second);
		};

		hook.on(first);
		hook.on(second);

		await hook.trigger(1);
		await hook.trigger(2);

		expect(calls).toEqual([1, 2, 2]);
	});

	it("removes scoped listeners when the scope is disposed", async () => {
		const hook = createEventHook<number>();
		const calls: number[] = [];
		const scope = createScope();

		runWithScope(scope, () => {
			hook.on((value) => calls.push(value));
		});

		await hook.trigger(1);
		disposeScope(scope);
		await hook.trigger(2);

		expect(calls).toEqual([1]);
	});

	it("can be imported and created without browser globals", async () => {
		const mod = await import("./index");
		const hook = mod.createEventHook<string>();
		const calls: string[] = [];

		hook.on((value) => calls.push(value));
		await hook.trigger("ready");

		expect(globalThis.window).toBeUndefined();
		expect(calls).toEqual(["ready"]);
	});
});
