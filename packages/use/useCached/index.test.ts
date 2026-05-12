// @vitest-environment node

import {
	computed,
	createScope,
	deepSignal,
	disposeScope,
	molecule,
	mountMolecule,
	nextTick,
	readonly,
	runWithScope,
	signal,
	watchEffect,
} from "@sigrea/core";
import { describe, expect, it, vi } from "vitest";

import { useCached } from "./index";

function valueEquals(
	newValue: { value: number },
	cachedValue: { value: number },
): boolean {
	return newValue.value === cachedValue.value;
}

describe("useCached", () => {
	it("is defined", () => {
		expect(useCached).toBeDefined();
	});

	it("updates with the default comparator", () => {
		const source = signal(true);
		const cached = useCached(source);

		expect(cached.value).toBe(true);

		source.value = false;

		expect(cached.value).toBe(false);
	});

	it("uses Object.is for the default comparator", () => {
		const source = signal(0);
		const cached = useCached(source);

		source.value = -0;

		expect(Object.is(cached.value, -0)).toBe(true);
	});

	it("keeps the cached value while the comparator matches", () => {
		const source = signal({ value: 42, extra: 0 });
		const initialValue = source.value;
		const cached = useCached(source, valueEquals);

		source.value = { value: 42, extra: 1 };

		expect(cached.value).toBe(initialValue);

		source.value = { value: 43, extra: 1 };

		expect(cached.value).not.toBe(initialValue);
		expect(cached.value).toEqual({ value: 43, extra: 1 });
	});

	it("passes the new source value first", () => {
		const source = signal(0);
		const comparator = vi.fn(() => true);
		const cached = useCached(source, comparator);

		source.value = 1;

		expect(comparator).toHaveBeenCalledWith(1, 0);
		expect(cached.value).toBe(0);
	});

	it("passes the latest cached value on later comparisons", () => {
		const source = signal(0);
		const comparator = vi.fn(
			(newValue: number, cachedValue: number) => newValue === cachedValue,
		);
		const cached = useCached(source, comparator);

		source.value = 1;
		source.value = 2;

		expect(comparator).toHaveBeenNthCalledWith(1, 1, 0);
		expect(comparator).toHaveBeenNthCalledWith(2, 2, 1);
		expect(cached.value).toBe(2);
	});

	it("does not leak cached reads into an outer effect", async () => {
		const source = signal(0);
		const shouldUpdateSource = signal(false);
		const cached = useCached(source);
		const calls: boolean[] = [];

		watchEffect(() => {
			calls.push(shouldUpdateSource.value);
			if (shouldUpdateSource.value) {
				source.value = 1;
			}
		});

		shouldUpdateSource.value = true;
		await nextTick();

		expect(calls).toEqual([false, true]);
		expect(source.value).toBe(1);
		expect(cached.value).toBe(1);

		source.value = 2;
		await nextTick();

		expect(calls).toEqual([false, true]);
		expect(source.value).toBe(2);
		expect(cached.value).toBe(2);
	});

	it("does not leak comparator dependencies into an outer effect", async () => {
		const source = signal(0);
		const threshold = signal(10);
		const shouldUpdateSource = signal(false);
		const cached = useCached(
			source,
			(newValue, cachedValue) => newValue + threshold.value === cachedValue,
		);
		const calls: boolean[] = [];

		watchEffect(() => {
			calls.push(shouldUpdateSource.value);
			if (shouldUpdateSource.value) {
				source.value = 1;
			}
		});

		shouldUpdateSource.value = true;
		await nextTick();

		expect(calls).toEqual([false, true]);
		expect(cached.value).toBe(1);

		threshold.value = 20;
		await nextTick();

		expect(calls).toEqual([false, true]);
	});

	it("tracks getter and computed sources", () => {
		const count = signal(1);
		const doubled = computed(() => count.value * 2);
		const cachedGetter = useCached(() => count.value + 1);
		const cachedComputed = useCached(doubled);

		count.value = 2;

		expect(cachedGetter.value).toBe(3);
		expect(cachedComputed.value).toBe(4);
	});

	it("tracks readonly signal sources", () => {
		const source = signal("initial");
		const cached = useCached(readonly(source));

		source.value = "updated";

		expect(cached.value).toBe("updated");
	});

	it("returns a readonly cached signal", () => {
		const source = signal(0);
		const cached = useCached(source);

		expect(() => {
			(cached as { value: number }).value = 10;
		}).toThrow(TypeError);

		expect(source.value).toBe(0);
		expect(cached.value).toBe(0);
	});

	it("can watch nested deep-signal values when deep is enabled", () => {
		const source = deepSignal({ nested: { count: 0 } });
		const comparator = vi.fn(() => false);
		const cached = useCached(source, comparator, { deep: true });

		source.nested.count = 1;

		expect(comparator).toHaveBeenCalledWith(source, cached.value);
	});

	it("cleans up source watches with scope disposal", () => {
		const scope = createScope();
		const source = signal("initial");
		let cached!: ReturnType<typeof useCached<string>>;

		runWithScope(scope, () => {
			cached = useCached(source);
		});

		source.value = "active";
		expect(cached.value).toBe("active");

		disposeScope(scope);
		source.value = "after-dispose";

		expect(cached.value).toBe("active");
	});

	it("updates setup changes when a molecule mounts", () => {
		const useValues = molecule(() => {
			const source = signal({ value: 1 });
			const cached = useCached(source, valueEquals);

			return { source, cached };
		});
		const instance = useValues();

		instance.source.value = { value: 2 };
		expect(instance.cached.value).toEqual({ value: 1 });

		mountMolecule(instance);

		expect(instance.cached.value).toEqual({ value: 2 });
	});

	it("passes through watch flush options", async () => {
		const source = signal(0);
		const cached = useCached(source, undefined, { flush: "post" });

		source.value = 1;

		expect(cached.value).toBe(0);

		await nextTick();

		expect(cached.value).toBe(1);
	});
});
