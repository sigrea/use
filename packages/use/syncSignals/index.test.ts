// @vitest-environment node

import {
	computed,
	createScope,
	deepSignal,
	disposeMolecule,
	disposeScope,
	markRaw,
	molecule,
	mountMolecule,
	nextTick,
	readonly,
	runWithScope,
	signal,
	unmountMolecule,
} from "@sigrea/core";
import { describe, expect, it } from "vitest";

import { syncSignals } from "./index";

describe("syncSignals", () => {
	it("syncs a single writable target from the source", () => {
		const source = signal("source");
		const target = signal("target");

		const stop = syncSignals(source, target);

		expect(target.value).toBe("source");

		target.value = "target-only";
		expect(source.value).toBe("source");

		source.value = "next";
		expect(target.value).toBe("next");

		stop();
		source.value = "stopped";

		expect(target.value).toBe("next");
	});

	it("syncs multiple targets from the source", () => {
		const source = signal("source");
		const first = signal("first");
		const second = signal("second");

		syncSignals(source, [first, second]);

		expect(first.value).toBe("source");
		expect(second.value).toBe("source");

		source.value = "next";

		expect(first.value).toBe("next");
		expect(second.value).toBe("next");
	});

	it("accepts readonly signals, computed values, and getters as sources", () => {
		const base = signal(1);
		const readonlySource = readonly(base);
		const doubled = computed(() => base.value * 2);
		const first = signal(0);
		const second = signal(0);
		const third = signal(0);

		syncSignals(readonlySource, first);
		syncSignals(doubled, second);
		syncSignals(() => base.value * 3, third);

		expect(first.value).toBe(1);
		expect(second.value).toBe(2);
		expect(third.value).toBe(3);

		base.value = 2;

		expect(first.value).toBe(2);
		expect(second.value).toBe(4);
		expect(third.value).toBe(6);
	});

	it("accepts direct deep-signal sources", () => {
		const source = deepSignal({ nested: { count: 0 } });
		const target = signal(deepSignal({ nested: { count: 100 } }));

		syncSignals(source, target, { immediate: false });

		source.nested = { count: 1 };

		expect(target.value).toBe(source);
	});

	it("can skip immediate sync", () => {
		const source = signal("source");
		const target = signal("target");

		syncSignals(source, target, { immediate: false });

		expect(target.value).toBe("target");

		source.value = "next";

		expect(target.value).toBe("next");
	});

	it("respects pre flush timing", async () => {
		const source = signal("source");
		const target = signal("target");

		syncSignals(source, target, { flush: "pre" });

		source.value = "first";
		source.value = "second";

		expect(target.value).toBe("source");

		await nextTick();

		expect(target.value).toBe("second");
	});

	it("respects post flush timing for multiple targets", async () => {
		const source = signal("source");
		const first = signal("first");
		const second = signal("second");

		syncSignals(source, [first, second], { flush: "post" });

		source.value = "next";

		expect(first.value).toBe("source");
		expect(second.value).toBe("source");

		await nextTick();

		expect(first.value).toBe("next");
		expect(second.value).toBe("next");
	});

	it("does not watch nested values by default", () => {
		const source = signal(deepSignal({ nested: { count: 0 } }));
		const target = signal(deepSignal({ nested: { count: 100 } }));

		syncSignals(source, target, { immediate: false });

		source.value.nested.count = 1;

		expect(target.value.nested.count).toBe(100);
	});

	it("can watch nested deep-signal values when deep is enabled", () => {
		const source = signal(deepSignal({ nested: { count: 0 } }));
		const target = signal(deepSignal({ nested: { count: 100 } }));

		syncSignals(source, target, { deep: true, immediate: false });

		source.value.nested.count = 1;

		expect(target.value.nested.count).toBe(1);
		expect(target.value).toBe(source.value);
	});

	it("registers cleanup with the current scope", () => {
		const scope = createScope();
		const source = signal("source");
		const target = signal("target");

		runWithScope(scope, () => {
			syncSignals(source, target);
		});

		expect(target.value).toBe("source");

		disposeScope(scope);
		source.value = "after-dispose";

		expect(target.value).toBe("source");
	});

	it("syncs the initial value during molecule setup before mount", () => {
		const useValues = molecule(() => {
			const source = signal("source");
			const target = signal("target");

			syncSignals(source, target);

			return { source, target };
		});

		const instance = useValues();

		expect(instance.target.value).toBe("source");

		instance.source.value = "before-mount";
		expect(instance.target.value).toBe("source");

		mountMolecule(instance);

		expect(instance.target.value).toBe("before-mount");

		disposeMolecule(instance);
	});

	it("does not overwrite target-only molecule setup changes on mount", () => {
		const useValues = molecule(() => {
			const source = signal("source");
			const target = signal("target");

			syncSignals(source, target);

			return { source, target };
		});

		const instance = useValues();

		instance.target.value = "target-before-mount";
		mountMolecule(instance);

		expect(instance.source.value).toBe("source");
		expect(instance.target.value).toBe("target-before-mount");

		disposeMolecule(instance);
	});

	it("syncs molecule setup source changes on mount when immediate is false", () => {
		const useValues = molecule(() => {
			const source = signal("source");
			const target = signal("target");

			syncSignals(source, target, { immediate: false });

			return { source, target };
		});

		const instance = useValues();

		instance.source.value = "before-mount";
		expect(instance.target.value).toBe("target");

		mountMolecule(instance);

		expect(instance.target.value).toBe("before-mount");

		disposeMolecule(instance);
	});

	it("syncs deep molecule setup changes on mount", () => {
		const useValues = molecule(() => {
			const source = signal(deepSignal({ nested: { count: 0 } }));
			const target = signal(deepSignal({ nested: { count: 100 } }));

			syncSignals(source, target, { deep: true, immediate: false });

			return { source, target };
		});

		const instance = useValues();

		instance.source.value.nested.count = 1;
		mountMolecule(instance);

		expect(instance.target.value.nested.count).toBe(1);
		expect(instance.target.value).toBe(instance.source.value);

		disposeMolecule(instance);
	});

	it("does not sync markRaw nested changes on mount", () => {
		const useValues = molecule(() => {
			const sourceRaw = markRaw({ count: 0 });
			const targetRaw = markRaw({ count: 100 });
			const source = signal(deepSignal({ nested: sourceRaw }));
			const target = signal(deepSignal({ nested: targetRaw }));

			syncSignals(source, target, { deep: true, immediate: false });

			return { source, target };
		});

		const instance = useValues();

		instance.source.value.nested.count = 1;
		mountMolecule(instance);

		expect(instance.source.value.nested.count).toBe(1);
		expect(instance.target.value.nested.count).toBe(100);

		disposeMolecule(instance);
	});

	it("syncs deep molecule setup sparse array writes on mount", () => {
		const useValues = molecule(() => {
			const sourceItems = new Array<number | undefined>(1);
			const targetItems = [100] as Array<number | undefined>;
			const source = signal(deepSignal({ items: sourceItems }));
			const target = signal(deepSignal({ items: targetItems }));

			syncSignals(source, target, { deep: true, immediate: false });

			return { source, target };
		});

		const instance = useValues();

		instance.source.value.items[0] = undefined;
		mountMolecule(instance);

		expect(0 in instance.target.value.items).toBe(true);
		expect(instance.target.value).toBe(instance.source.value);

		disposeMolecule(instance);
	});

	it.each(["pre", "post"] as const)(
		"syncs pending %s-flush source changes after molecule remount",
		async (flush) => {
			const useValues = molecule(() => {
				const source = signal("source");
				const target = signal("target");

				syncSignals(source, target, { flush });

				return { source, target };
			});

			const instance = useValues();

			mountMolecule(instance);
			instance.source.value = "changed";
			expect(instance.target.value).toBe("source");

			unmountMolecule(instance);
			mountMolecule(instance);

			expect(instance.target.value).toBe("changed");

			await nextTick();

			expect(instance.target.value).toBe("changed");

			disposeMolecule(instance);
		},
	);

	it("rejects raw sources when the type is erased", () => {
		const target = signal("target");
		const call = syncSignals as (source: unknown, targets: unknown) => unknown;

		expect(() => call("source", target)).toThrow(TypeError);
	});

	it("validates all targets before writing initial values", () => {
		const source = signal("source");
		const first = signal("first");
		const readonlyTarget = readonly(signal("readonly"));
		const call = syncSignals as (source: unknown, targets: unknown) => unknown;

		expect(() => call(source, [first, readonlyTarget])).toThrow(TypeError);
		expect(first.value).toBe("first");
	});

	it("rejects sparse target arrays before writing initial values", () => {
		const source = signal("source");
		const first = signal("first");
		const second = signal("second");
		const targets = new Array<typeof first | undefined>(3);
		targets[0] = first;
		targets[2] = second;
		const call = syncSignals as (source: unknown, targets: unknown) => unknown;

		expect(() => call(source, targets)).toThrow(TypeError);
		expect(first.value).toBe("first");
		expect(second.value).toBe("second");
	});

	it("rejects readonly targets when the type is erased", () => {
		const source = signal("source");
		const target = readonly(signal("target"));
		const call = syncSignals as (source: unknown, targets: unknown) => unknown;

		expect(() => call(source, target)).toThrow(TypeError);
	});

	it("rejects computed targets when the type is erased", () => {
		const source = signal("source");
		const target = computed(() => "target");
		const call = syncSignals as (source: unknown, targets: unknown) => unknown;

		expect(() => call(source, target)).toThrow(TypeError);
	});

	it("rejects writable computed targets when the type is erased", () => {
		const source = signal("source");
		const state = signal("target");
		const target = computed({
			get: () => state.value,
			set: (value: string) => {
				state.value = value;
			},
		});
		const call = syncSignals as (source: unknown, targets: unknown) => unknown;

		expect(() => call(source, target)).toThrow(TypeError);
	});

	it("can be imported and created without browser globals", async () => {
		const mod = await import("./index");
		const source = signal("source");
		const target = signal("target");

		const stop = mod.syncSignals(source, target);

		expect(globalThis.window).toBeUndefined();
		expect(target.value).toBe("source");

		stop();
	});
});
