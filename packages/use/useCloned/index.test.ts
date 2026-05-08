// @vitest-environment node

import {
	computed,
	createScope,
	deepSignal,
	disposeScope,
	isDeepSignal,
	nextTick,
	runWithScope,
	signal,
} from "@sigrea/core";
import { describe, expect, it, vi } from "vitest";

import { cloneStructured, useCloned } from "./index";

describe("useCloned", () => {
	it("clones plain source values and syncs manually", () => {
		const source = { nested: { count: 1 } };
		const result = useCloned(source);

		expect(result.cloned.value).toEqual(source);
		expect(result.cloned.value).not.toBe(source);
		expect(result.cloned.value.nested).not.toBe(source.nested);

		result.cloned.value = { nested: { count: 2 } };
		expect(result.isModified.value).toBe(true);

		result.sync();

		expect(result.cloned.value).toEqual(source);
		expect(result.cloned.value).not.toBe(source);
		expect(result.isModified.value).toBe(false);
		result.stop();
	});

	it("watches signal sources by default", () => {
		const source = signal({ count: 1 });
		const result = useCloned(source);

		source.value = { count: 2 };

		expect(result.cloned.value).toEqual({ count: 2 });
		expect(result.cloned.value).not.toBe(source.value);
		expect(result.isModified.value).toBe(false);
		result.stop();
	});

	it("watches getter and computed sources", () => {
		const source = signal(1);
		const getterResult = useCloned(() => ({ count: source.value }), {
			flush: "sync",
		});
		const computedResult = useCloned(
			computed(() => ({ count: source.value })),
			{
				flush: "sync",
			},
		);

		source.value = 2;

		expect(getterResult.cloned.value).toEqual({ count: 2 });
		expect(computedResult.cloned.value).toEqual({ count: 2 });
		getterResult.stop();
		computedResult.stop();
	});

	it("supports manual sync", () => {
		const source = signal({ count: 1 });
		const result = useCloned(source, { manual: true });

		source.value = { count: 2 };

		expect(result.cloned.value).toEqual({ count: 1 });

		result.sync();

		expect(result.cloned.value).toEqual({ count: 2 });
		expect(result.isModified.value).toBe(false);
		result.stop();
	});

	it("tracks cloned mutations with isModified", () => {
		const source = signal({ nested: { count: 1 } });
		const result = useCloned(source);

		expect(result.isModified.value).toBe(false);

		result.cloned.value.nested.count = 2;

		expect(result.isModified.value).toBe(true);

		result.sync();

		expect(result.isModified.value).toBe(false);
		result.stop();
	});

	it("keeps source and cloned mutations isolated", () => {
		const source = signal({ nested: { count: 1 } });
		const result = useCloned(source);

		result.cloned.value.nested.count = 2;

		expect(source.value.nested.count).toBe(1);

		source.value.nested.count = 3;

		expect(result.cloned.value.nested.count).toBe(2);
		result.stop();
	});

	it("uses custom clone", () => {
		const source = signal({ count: 1 });
		const clone = vi.fn((value: { count: number }) => ({
			count: value.count,
			copied: true,
		}));
		const result = useCloned(source, { clone, flush: "sync" });

		expect(result.cloned.value).toEqual({ count: 1, copied: true });

		source.value = { count: 2 };

		expect(clone).toHaveBeenLastCalledWith({ count: 2 });
		expect(result.cloned.value).toEqual({ count: 2, copied: true });
		result.stop();
	});

	it("leaves cloned state untouched when clone fails", () => {
		const source = signal({ count: 1 });
		const error = new Error("cannot clone");
		const result = useCloned(source, {
			clone: (value) => {
				if (value.count === 2) {
					throw error;
				}
				return { ...value };
			},
			flush: "sync",
		});

		result.cloned.value = { count: 10 };

		expect(() => {
			source.value = { count: 2 };
		}).toThrow(error);
		expect(result.cloned.value).toEqual({ count: 10 });
		expect(result.isModified.value).toBe(true);
		result.stop();
	});

	it("respects deep false", async () => {
		const source = deepSignal({ nested: { count: 1 } });
		const result = useCloned(source, { deep: false });

		source.nested.count = 2;
		await nextTick();

		expect(result.cloned.value).toEqual({ nested: { count: 1 } });

		source.nested = { count: 3 };
		await nextTick();

		expect(result.cloned.value).toEqual({ nested: { count: 3 } });
		result.stop();
	});

	it("watches nested deep-signal values when deep is true", async () => {
		const source = deepSignal({ nested: { count: 1 } });
		const result = useCloned(source, { deep: true });

		source.nested.count = 2;
		await nextTick();

		expect(result.cloned.value).toEqual({ nested: { count: 2 } });
		result.stop();
	});

	it("clones public values from nested signals and deep signals", () => {
		const count = signal(1);
		const createdAt = signal(new Date("2024-01-01T00:00:00.000Z"));
		const pattern = signal(/sigrea/gi);
		const child = deepSignal({ count: 2 });
		const source = deepSignal({ child, count, createdAt, pattern });
		const structured = cloneStructured(source);
		const result = useCloned(source);

		expect(structured.child).toEqual({ count: 2 });
		expect(structured.count).toBe(1);
		expect(structured.createdAt).toEqual(createdAt.value);
		expect(structured.createdAt).not.toBe(createdAt.value);
		expect(structured.pattern.source).toBe(pattern.value.source);
		expect(structured.pattern.flags).toBe(pattern.value.flags);
		expect(structured.pattern).not.toBe(pattern.value);
		expect(isDeepSignal(structured.child)).toBe(false);
		expect(structured.child).not.toBe(child);
		expect(result.cloned.value.child).toEqual({ count: 2 });
		expect(result.cloned.value.count).toBe(1);
		expect(result.cloned.value.createdAt).toEqual(createdAt.value);
		expect(result.cloned.value.pattern.source).toBe(pattern.value.source);
		expect(result.cloned.value.pattern.flags).toBe(pattern.value.flags);
		expect(result.cloned.value.child).not.toBe(child);

		count.value = 3;
		child.count = 4;
		result.sync();

		expect(result.cloned.value.child).toEqual({ count: 4 });
		expect(result.cloned.value.count).toBe(3);
		result.stop();
	});

	it("returns recursively cloned nested signal values", () => {
		const primitive = signal(signal(1));
		const text = signal(signal("ready"));
		const innerObject = signal({ count: 2 });
		const object = signal(innerObject);
		const source = { object, primitive, text };
		const structured = cloneStructured(source);
		const result = useCloned(source);

		expect(cloneStructured(primitive)).toBe(1);
		expect(structured).toEqual({
			object: { count: 2 },
			primitive: 1,
			text: "ready",
		});
		expect(structured.object).not.toBe(innerObject.value);
		expect(result.cloned.value).toEqual({
			object: { count: 2 },
			primitive: 1,
			text: "ready",
		});
		expect(result.cloned.value.object).not.toBe(innerObject.value);
		result.stop();
	});

	it("preserves cycles through nested signals", () => {
		const raw: { self?: unknown } = {};
		const inner = signal(raw);
		const outer = signal(inner);
		raw.self = outer;

		const structured = cloneStructured(outer);
		const result = useCloned<typeof inner, typeof raw>(outer);

		expect(structured.self).toBe(structured);
		expect(result.cloned.value.self).toBe(result.cloned.value);
		result.stop();
	});

	it("handles clone cycles that pass through signals", () => {
		const signalCycle = signal<unknown>();
		const objectCycle: { self?: unknown } = {};
		const objectSignal = signal(objectCycle);
		const deepRaw: { self?: unknown } = {};
		const deepRawSignal = signal(deepRaw);
		const deepSource = deepSignal(deepRaw);
		signalCycle.value = signalCycle;
		objectCycle.self = objectSignal;
		deepRaw.self = deepRawSignal;

		const signalClone = cloneStructured(signalCycle);
		const objectClone = cloneStructured(objectSignal);
		const deepClone = cloneStructured(deepSource);

		expect(signalClone).toEqual({});
		expect(objectClone.self).toBe(objectClone);
		expect(deepClone.self).toBe(deepClone);
	});

	it("passes through flush options", async () => {
		const preSource = signal({ count: 1 });
		const postSource = signal({ count: 1 });
		const syncSource = signal({ count: 1 });
		const cloneOrder: string[] = [];
		const preResult = useCloned(preSource, {
			clone: (value) => {
				cloneOrder.push(`pre:${value.count}`);
				return { ...value };
			},
			flush: "pre",
		});
		const postResult = useCloned(postSource, {
			clone: (value) => {
				cloneOrder.push(`post:${value.count}`);
				return { ...value };
			},
			flush: "post",
		});
		const syncResult = useCloned(syncSource, {
			clone: (value) => {
				cloneOrder.push(`sync:${value.count}`);
				return { ...value };
			},
			flush: "sync",
		});

		cloneOrder.length = 0;

		preSource.value = { count: 2 };
		postSource.value = { count: 2 };
		syncSource.value = { count: 2 };

		expect(cloneOrder).toEqual(["sync:2"]);
		expect(preResult.cloned.value).toEqual({ count: 1 });
		expect(postResult.cloned.value).toEqual({ count: 1 });
		expect(syncResult.cloned.value).toEqual({ count: 2 });

		await Promise.resolve();

		expect(cloneOrder).toEqual(["sync:2", "pre:2"]);
		expect(preResult.cloned.value).toEqual({ count: 2 });
		expect(postResult.cloned.value).toEqual({ count: 1 });

		await nextTick();

		expect(cloneOrder).toEqual(["sync:2", "pre:2", "post:2"]);
		expect(preResult.cloned.value).toEqual({ count: 2 });
		expect(postResult.cloned.value).toEqual({ count: 2 });
		preResult.stop();
		postResult.stop();
		syncResult.stop();
	});

	it("stops source and cloned watchers", () => {
		const source = signal({ count: 1 });
		const result = useCloned(source, { flush: "sync" });

		result.stop();
		source.value = { count: 2 };
		result.cloned.value = { count: 3 };

		expect(result.cloned.value).toEqual({ count: 3 });
		expect(result.isModified.value).toBe(false);
	});

	it("stops watchers on scope disposal", () => {
		const scope = createScope();
		const source = signal({ count: 1 });
		const result = runWithScope(scope, () =>
			useCloned(source, { flush: "sync" }),
		);

		disposeScope(scope);
		source.value = { count: 2 };
		result.cloned.value = { count: 3 };

		expect(result.cloned.value).toEqual({ count: 3 });
		expect(result.isModified.value).toBe(false);
	});

	it("falls back to JSON clone when structuredClone is unavailable", () => {
		const structuredClone = globalThis.structuredClone;

		try {
			Object.defineProperty(globalThis, "structuredClone", {
				configurable: true,
				value: undefined,
			});

			const source = { nested: { count: 1 } };
			const cloned = cloneStructured(source);

			expect(cloned).toEqual(source);
			expect(cloned).not.toBe(source);
			expect(cloned.nested).not.toBe(source.nested);
			expect(cloneStructured(undefined)).toBeUndefined();
		} finally {
			Object.defineProperty(globalThis, "structuredClone", {
				configurable: true,
				value: structuredClone,
			});
		}
	});
});
