// @vitest-environment node

import { createScope, disposeScope, runWithScope } from "@sigrea/core";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useEventBus } from "./index";
import { events } from "./internal";

describe("useEventBus", () => {
	beforeEach(() => {
		events.clear();
	});

	it("emits events to registered listeners", async () => {
		const bus = useEventBus<string>("news");
		const calls: string[] = [];

		bus.on((event) => calls.push(event));
		await bus.emit("ready");

		expect(calls).toEqual(["ready"]);
	});

	it("passes tuple payload arguments", async () => {
		const bus = useEventBus<[event: "inc" | "dec", payload: number]>("counter");
		const calls: Array<["inc" | "dec", number]> = [];

		bus.on((event, payload) => {
			calls.push([event, payload]);
		});

		await bus.emit("inc", 3);

		expect(calls).toEqual([["inc", 3]]);
	});

	it("removes a listener from the returned off handle", async () => {
		const bus = useEventBus<number>("off-handle");
		const calls: number[] = [];
		const listener = (event: number) => calls.push(event);
		const handle = bus.on(listener);

		await bus.emit(1);
		handle.off();
		await bus.emit(2);

		expect(calls).toEqual([1]);
	});

	it("removes a listener from off", async () => {
		const bus = useEventBus<number>("off");
		const calls: number[] = [];
		const listener = (event: number) => calls.push(event);

		bus.on(listener);
		bus.off(listener);
		await bus.emit(1);

		expect(calls).toEqual([]);
	});

	it("keeps listeners isolated by key", async () => {
		const foo = useEventBus<number>("foo");
		const bar = useEventBus<number>("bar");
		const calls: string[] = [];
		const fooListener = (event: number) => calls.push(`foo:${event}`);
		const barListener = (event: number) => calls.push(`bar:${event}`);

		foo.on(fooListener);
		bar.on(barListener);
		foo.off(barListener);
		bar.off(fooListener);

		await foo.emit(1);
		await bar.emit(2);

		expect(calls).toEqual(["foo:1", "bar:2"]);
	});

	it("clears all listeners for the current key", async () => {
		const bus = useEventBus<number>("reset");
		const calls: number[] = [];

		bus.on((event) => calls.push(event));
		bus.on((event) => calls.push(event + 1));
		bus.reset();
		await bus.emit(1);

		bus.on((event) => calls.push(event + 2));
		await bus.emit(2);

		expect(calls).toEqual([4]);
	});

	it("does not clear listeners for other keys", async () => {
		const foo = useEventBus<number>("reset-foo");
		const bar = useEventBus<number>("reset-bar");
		const calls: string[] = [];

		foo.on((event) => calls.push(`foo:${event}`));
		bar.on((event) => calls.push(`bar:${event}`));

		foo.reset();
		await foo.emit(1);
		await bar.emit(2);

		expect(calls).toEqual(["bar:2"]);
	});

	it("fires once listeners only once", async () => {
		const bus = useEventBus<number>("once");
		const calls: number[] = [];

		bus.once((event) => calls.push(event));

		await bus.emit(1);
		await bus.emit(2);
		await bus.emit(3);

		expect(calls).toEqual([1]);
		expect(events.has("once")).toBe(false);
	});

	it("registers the same listener once for the same key", async () => {
		const bus = useEventBus<number>("same-key");
		const listener = vi.fn();

		bus.on(listener);
		bus.on(listener);
		await bus.emit(1);

		expect(listener).toHaveBeenCalledTimes(1);

		bus.off(listener);
		await bus.emit(2);

		expect(listener).toHaveBeenCalledTimes(1);
		expect(events.has("same-key")).toBe(false);
	});

	it("allows the same listener on different keys", async () => {
		const foo = useEventBus<string>("listener-foo");
		const bar = useEventBus<string>("listener-bar");
		const listener = vi.fn();

		foo.on(listener);
		bar.on(listener);

		await foo.emit("foo");
		await bar.emit("bar");

		expect(listener).toHaveBeenCalledTimes(2);
		expect(listener).toHaveBeenNthCalledWith(1, "foo");
		expect(listener).toHaveBeenNthCalledWith(2, "bar");
	});

	it("removes scoped listeners when the scope is disposed", async () => {
		const bus = useEventBus<number>("scope");
		const calls: number[] = [];
		const scope = createScope();

		runWithScope(scope, () => {
			bus.on((event) => calls.push(event));
		});

		await bus.emit(1);
		disposeScope(scope);
		await bus.emit(2);

		expect(calls).toEqual([1]);
		expect(events.has("scope")).toBe(false);
	});

	it("uses the listener set snapshot for each emit", async () => {
		const bus = useEventBus<number>("snapshot-off");
		const calls: string[] = [];
		const second = (event: number) => {
			calls.push(`b:${event}`);
		};
		const first = (event: number) => {
			calls.push(`a:${event}`);
			bus.off(second);
		};

		bus.on(first);
		bus.on(second);

		await bus.emit(1);
		await bus.emit(2);

		expect(calls).toEqual(["a:1", "b:1", "a:2"]);
	});

	it("does not call listeners added during the current emit", async () => {
		const bus = useEventBus<number>("snapshot-on");
		const calls: string[] = [];
		const second = (event: number) => {
			calls.push(`b:${event}`);
		};
		const first = (event: number) => {
			calls.push(`a:${event}`);
			bus.on(second);
		};

		bus.on(first);

		await bus.emit(1);
		await bus.emit(2);

		expect(calls).toEqual(["a:1", "a:2", "b:2"]);
	});

	it("resolves listener return values and rejects thrown errors", async () => {
		const bus = useEventBus<number>("return-values");

		bus.on((event) => event * 2);
		bus.on(async (event) => event * 3);

		await expect(bus.emit(2)).resolves.toEqual([4, 6]);

		bus.on(() => {
			throw new Error("failed");
		});

		expect(() => bus.emit(3)).toThrow("failed");
	});

	it("cleans up the internal events map after reset", () => {
		const bus = useEventBus<number>("internal-reset");

		bus.on(() => {});
		expect(events.has("internal-reset")).toBe(true);

		bus.reset();
		expect(events.has("internal-reset")).toBe(false);
	});

	it("can be imported and used without browser globals", async () => {
		const mod = await import("./index");
		const bus = mod.useEventBus<string>("node");
		const calls: string[] = [];

		bus.on((event) => calls.push(event));
		await bus.emit("ready");

		expect(globalThis.window).toBeUndefined();
		expect(calls).toEqual(["ready"]);

		bus.reset();
	});
});
