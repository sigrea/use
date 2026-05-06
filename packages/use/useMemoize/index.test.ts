// @vitest-environment node

import { computed, nextTick, signal, watchEffect } from "@sigrea/core";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { UseMemoizeCache } from "../types";
import { useMemoize } from "./index";

describe("useMemoize", () => {
	const resolver = vi.fn((value: number) => `result-${value}`);

	beforeEach(() => {
		resolver.mockReset();
		resolver.mockImplementation((value: number) => `result-${value}`);
	});

	it("loads and caches values by serialized arguments", () => {
		const memo = useMemoize(resolver);

		expect(memo(1)).toBe("result-1");
		expect(memo(1)).toBe("result-1");
		expect(resolver).toHaveBeenCalledTimes(1);
		expect(resolver).toHaveBeenCalledWith(1);

		expect(memo(2)).toBe("result-2");
		expect(resolver).toHaveBeenCalledTimes(2);
		expect(resolver).toHaveBeenNthCalledWith(2, 2);
	});

	it("caches calls without arguments", () => {
		const noArgsResolver = vi.fn(() => "result");
		const memo = useMemoize(noArgsResolver);

		expect(memo()).toBe("result");
		expect(memo()).toBe("result");
		expect(noArgsResolver).toHaveBeenCalledOnce();
	});

	it("caches calls with multiple arguments", () => {
		const multiResolver = vi.fn(
			(left: number, right: number) => `result-${left}-${right}`,
		);
		const memo = useMemoize(multiResolver);

		expect(memo(1, 1)).toBe("result-1-1");
		expect(memo(1, 2)).toBe("result-1-2");
		expect(memo(1, 1)).toBe("result-1-1");
		expect(multiResolver).toHaveBeenCalledTimes(2);
	});

	it("caches undefined results", () => {
		const undefinedResolver = vi.fn((value: number) =>
			value === 1 ? undefined : `result-${value}`,
		);
		const memo = useMemoize(undefinedResolver);

		expect(memo(1)).toBeUndefined();
		expect(memo(1)).toBeUndefined();
		expect(undefinedResolver).toHaveBeenCalledOnce();
	});

	it("does not track resolver signal reads through computed readers", async () => {
		const source = signal(1);
		const signalResolver = vi.fn((_value: number) => `result-${source.value}`);
		const memo = useMemoize(signalResolver);
		const value = computed(() => memo(1));
		let updates = 0;

		watchEffect(() => {
			value.value;
			updates += 1;
		});

		expect(value.value).toBe("result-1");
		expect(updates).toBe(1);

		source.value = 2;
		await nextTick();

		expect(value.value).toBe("result-1");
		expect(updates).toBe(1);

		memo.load(1);
		await nextTick();

		expect(value.value).toBe("result-2");
		expect(updates).toBe(2);
		expect(signalResolver).toHaveBeenCalledTimes(2);
	});

	it("always resolves through the resolver on load", () => {
		const memo = useMemoize(resolver);

		expect(memo(1)).toBe("result-1");
		resolver.mockImplementation((value: number) => `next-${value}`);

		expect(memo(1)).toBe("result-1");
		expect(memo.load(1)).toBe("next-1");
		expect(memo(1)).toBe("next-1");
		expect(resolver).toHaveBeenCalledTimes(2);
	});

	it("updates computed readers when a cached value is reloaded", () => {
		const memo = useMemoize(resolver);
		const value = computed(() => memo(1));

		expect(value.value).toBe("result-1");
		resolver.mockImplementation((input: number) => `next-${input}`);

		expect(memo.load(1)).toBe("next-1");
		expect(value.value).toBe("next-1");
	});

	it("updates computed readers when the exposed cache is changed", () => {
		const memo = useMemoize(resolver);
		const value = computed(() => memo(1));
		const key = memo.generateKey(1);

		expect(value.value).toBe("result-1");

		memo.cache.set(key, "manual");

		expect(value.value).toBe("manual");
	});

	it("deletes cached values by arguments", () => {
		const memo = useMemoize(resolver);

		expect(memo(1)).toBe("result-1");
		expect(memo(2)).toBe("result-2");
		expect(resolver).toHaveBeenCalledTimes(2);

		resolver.mockClear();
		memo.delete(1);

		expect(memo(1)).toBe("result-1");
		expect(memo(2)).toBe("result-2");
		expect(resolver).toHaveBeenCalledTimes(1);
		expect(resolver).toHaveBeenCalledWith(1);
	});

	it("clears all cached values", () => {
		const memo = useMemoize(resolver);

		expect(memo(1)).toBe("result-1");
		expect(memo(2)).toBe("result-2");
		expect(resolver).toHaveBeenCalledTimes(2);

		resolver.mockClear();
		memo.clear();

		expect(memo(1)).toBe("result-1");
		expect(memo(2)).toBe("result-2");
		expect(resolver).toHaveBeenCalledTimes(2);
	});

	it("uses custom cache keys", () => {
		const getKey = vi.fn((value: number) => value % 2);
		const memo = useMemoize(resolver, { getKey });

		expect(memo(1)).toBe("result-1");
		expect(memo(2)).toBe("result-2");
		expect(resolver).toHaveBeenCalledTimes(2);

		resolver.mockClear();
		expect(memo(3)).toBe("result-1");
		expect(memo(4)).toBe("result-2");
		expect(resolver).not.toHaveBeenCalled();
		expect(getKey).toHaveBeenCalledWith(4);
	});

	it("reuses pending promises for async resolvers", async () => {
		const asyncResolver = vi.fn(async (value: number) => `result-${value}`);
		const memo = useMemoize(asyncResolver);

		const first = memo(1);
		const second = memo(1);

		expect(first).toBe(second);
		await expect(first).resolves.toBe("result-1");
		expect(asyncResolver).toHaveBeenCalledOnce();
	});

	it("delegates to a custom cache", () => {
		const has = vi.fn(() => true);
		const get = vi.fn((key: string) => key);
		const set = vi.fn();
		const deleteEntry = vi.fn();
		const clear = vi.fn();
		const cache: UseMemoizeCache<string, string> = {
			get,
			set,
			has,
			delete: deleteEntry,
			clear,
		};
		const serializedKey = JSON.stringify([1]);
		const memo = useMemoize(resolver, { cache });

		expect(memo(1)).toBe(serializedKey);
		expect(has).toHaveBeenCalledWith(serializedKey);
		expect(get).toHaveBeenCalledWith(serializedKey);
		expect(set).not.toHaveBeenCalled();

		has.mockReturnValue(false);
		expect(memo(1)).toBe(serializedKey);
		expect(set).toHaveBeenCalledWith(serializedKey, "result-1");

		memo.load(1);
		expect(set).toHaveBeenCalledWith(serializedKey, "result-1");

		memo.delete(1);
		expect(deleteEntry).toHaveBeenCalledWith(serializedKey);

		memo.clear();
		expect(clear).toHaveBeenCalledOnce();
	});
});
