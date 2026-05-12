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
import type { Signal } from "@sigrea/core";
import { describe, expect, it } from "vitest";

import { syncSignal } from "./index";

describe("syncSignal", () => {
	it("syncs writable signals in both directions by default", () => {
		const left = signal("left");
		const right = signal("right");

		const stop = syncSignal(left, right);

		expect(right.value).toBe("left");

		left.value = "updated-left";
		expect(right.value).toBe("updated-left");

		right.value = "updated-right";
		expect(left.value).toBe("updated-right");

		stop();
		left.value = "stopped";

		expect(right.value).toBe("updated-right");
	});

	it("supports one-way right-to-left sync", () => {
		const left = signal("left");
		const right = signal("right");

		syncSignal(left, right, { direction: "rtl" });

		expect(left.value).toBe("right");
		expect(right.value).toBe("right");

		left.value = "left-only";
		expect(right.value).toBe("right");

		right.value = "synced";
		expect(left.value).toBe("synced");
	});

	it("supports transforms for different value types", () => {
		const left = signal(10);
		const right = signal("2");

		syncSignal(left, right, {
			transform: {
				ltr: (value) => String(value * 2),
				rtl: (value) => Number(value) / 4,
			},
		});

		expect(right.value).toBe("20");
		expect(left.value).toBe(5);

		left.value = 8;
		expect(right.value).toBe("16");

		right.value = "12";
		expect(left.value).toBe(3);
	});

	it("can skip immediate sync", () => {
		const left = signal("left");
		const right = signal("right");

		syncSignal(left, right, { immediate: false });

		expect(left.value).toBe("left");
		expect(right.value).toBe("right");

		left.value = "next";

		expect(right.value).toBe("next");
	});

	it("respects async flush timing without bouncing its own write back", async () => {
		const left = signal("left");
		const right = signal("right");

		syncSignal(left, right, { flush: "pre" });

		left.value = "next";
		expect(right.value).toBe("left");

		await nextTick();

		expect(left.value).toBe("next");
		expect(right.value).toBe("next");

		right.value = "later";
		expect(left.value).toBe("next");

		await nextTick();

		expect(left.value).toBe("later");
		expect(right.value).toBe("later");
	});

	it("respects post flush timing without bouncing its own write back", async () => {
		const left = signal("left");
		const right = signal("right");

		syncSignal(left, right, { flush: "post" });

		left.value = "next";
		expect(right.value).toBe("left");

		await nextTick();

		expect(left.value).toBe("next");
		expect(right.value).toBe("next");

		right.value = "later";
		expect(left.value).toBe("next");

		await nextTick();

		expect(left.value).toBe("later");
		expect(right.value).toBe("later");
	});

	it("keeps deterministic order when both sides change in one async flush", async () => {
		const left = signal("left");
		const right = signal("right");

		syncSignal(left, right, { flush: "pre" });

		left.value = "left-next";
		right.value = "right-next";

		await nextTick();

		expect(left.value).toBe("left-next");
		expect(right.value).toBe("left-next");
	});

	it("can watch nested deep-signal values when deep is enabled", () => {
		const left = signal(deepSignal({ nested: { count: 0 } }));
		const right = signal(deepSignal({ nested: { count: 100 } }));

		syncSignal(left, right, { deep: true, immediate: false });

		left.value.nested.count = 1;

		expect(right.value.nested.count).toBe(1);
		expect(right.value).toBe(left.value);
	});

	it("registers cleanup with the current scope", () => {
		const scope = createScope();
		const left = signal("left");
		const right = signal("right");

		runWithScope(scope, () => {
			syncSignal(left, right);
		});

		expect(right.value).toBe("left");

		disposeScope(scope);
		left.value = "after-dispose";

		expect(right.value).toBe("left");
	});

	it("syncs the initial value during molecule setup before mount", () => {
		const useValues = molecule(() => {
			const left = signal("left");
			const right = signal("right");

			syncSignal(left, right);

			return { left, right };
		});

		const instance = useValues();

		expect(instance.right.value).toBe("left");

		instance.left.value = "before-mount";
		expect(instance.right.value).toBe("left");

		mountMolecule(instance);
		expect(instance.right.value).toBe("before-mount");

		instance.left.value = "mounted";

		expect(instance.right.value).toBe("mounted");

		disposeMolecule(instance);
	});

	it("syncs molecule setup changes on mount when immediate is false", () => {
		const useValues = molecule(() => {
			const left = signal("left");
			const right = signal("right");

			syncSignal(left, right, { immediate: false });

			return { left, right };
		});

		const instance = useValues();

		expect(instance.right.value).toBe("right");

		instance.left.value = "before-mount";
		expect(instance.right.value).toBe("right");

		mountMolecule(instance);
		expect(instance.right.value).toBe("before-mount");

		disposeMolecule(instance);
	});

	it("syncs deep molecule setup changes on mount", () => {
		const useValues = molecule(() => {
			const left = signal(deepSignal({ nested: { count: 0 } }));
			const right = signal(deepSignal({ nested: { count: 100 } }));

			syncSignal(left, right, { deep: true, immediate: false });

			return { left, right };
		});

		const instance = useValues();

		instance.left.value.nested.count = 1;
		mountMolecule(instance);

		expect(instance.right.value.nested.count).toBe(1);
		expect(instance.right.value).toBe(instance.left.value);

		disposeMolecule(instance);
	});

	it("syncs deep molecule setup reference replacements on mount", () => {
		const useValues = molecule(() => {
			const left = signal(deepSignal({ nested: { count: 0 } }));
			const right = signal(deepSignal({ nested: { count: 100 } }));

			syncSignal(left, right, { deep: true, immediate: false });

			return { left, right };
		});

		const instance = useValues();
		const nested = { count: 0 };

		instance.left.value.nested = nested;
		mountMolecule(instance);

		expect(instance.right.value.nested.count).toBe(0);
		expect(instance.right.value).toBe(instance.left.value);

		disposeMolecule(instance);
	});

	it("syncs deep molecule setup non-plain object replacements on mount", () => {
		const useValues = molecule(() => {
			const left = signal(deepSignal({ nested: new Date(0) }));
			const right = signal(deepSignal({ nested: new Date(100) }));

			syncSignal(left, right, { deep: true, immediate: false });

			return { left, right };
		});

		const instance = useValues();
		const nested = new Date(200);

		instance.left.value.nested = nested;
		mountMolecule(instance);

		expect(instance.right.value.nested).toBe(nested);
		expect(instance.right.value).toBe(instance.left.value);

		disposeMolecule(instance);
	});

	it("syncs deep molecule setup class instance changes on mount", () => {
		class Box {
			constructor(public count: number) {}
		}
		const useValues = molecule(() => {
			const left = signal(deepSignal({ nested: new Box(0) }));
			const right = signal(deepSignal({ nested: new Box(100) }));

			syncSignal(left, right, { deep: true, immediate: false });

			return { left, right };
		});

		const instance = useValues();

		instance.left.value.nested.count = 1;
		mountMolecule(instance);

		expect(instance.right.value.nested.count).toBe(1);
		expect(instance.right.value).toBe(instance.left.value);

		disposeMolecule(instance);
	});

	it("does not sync markRaw nested changes on mount", () => {
		const useValues = molecule(() => {
			const leftRaw = markRaw({ count: 0 });
			const rightRaw = markRaw({ count: 100 });
			const left = signal(deepSignal({ nested: leftRaw }));
			const right = signal(deepSignal({ nested: rightRaw }));

			syncSignal(left, right, { deep: true, immediate: false });

			return { left, right };
		});

		const instance = useValues();

		instance.left.value.nested.count = 1;
		mountMolecule(instance);

		expect(instance.left.value.nested.count).toBe(1);
		expect(instance.right.value.nested.count).toBe(100);

		disposeMolecule(instance);
	});

	it("syncs deep molecule setup sparse array writes on mount", () => {
		const useValues = molecule(() => {
			const leftItems = new Array<number | undefined>(1);
			const rightItems = [100] as Array<number | undefined>;
			const left = signal(deepSignal({ items: leftItems }));
			const right = signal(deepSignal({ items: rightItems }));

			syncSignal(left, right, { deep: true, immediate: false });

			return { left, right };
		});

		const instance = useValues();

		instance.left.value.items[0] = undefined;
		mountMolecule(instance);

		expect(0 in instance.right.value.items).toBe(true);
		expect(instance.right.value).toBe(instance.left.value);

		disposeMolecule(instance);
	});

	it("syncs right-only molecule setup changes on mount", () => {
		const useValues = molecule(() => {
			const left = signal("left");
			const right = signal("right");

			syncSignal(left, right);

			return { left, right };
		});

		const instance = useValues();

		instance.right.value = "before-mount";
		mountMolecule(instance);

		expect(instance.left.value).toBe("before-mount");
		expect(instance.right.value).toBe("before-mount");

		disposeMolecule(instance);
	});

	it("uses right-to-left order when both molecule setup sides change before mount", () => {
		const useValues = molecule(() => {
			const left = signal("left");
			const right = signal("right");

			syncSignal(left, right, { immediate: false });

			return { left, right };
		});

		const instance = useValues();

		instance.left.value = "left-before-mount";
		instance.right.value = "right-before-mount";
		mountMolecule(instance);

		expect(instance.left.value).toBe("right-before-mount");
		expect(instance.right.value).toBe("right-before-mount");

		disposeMolecule(instance);
	});

	it("does not sync non-source setup changes for one-way direction on mount", () => {
		const useLtrValues = molecule(() => {
			const left = signal("left");
			const right = signal("right");

			syncSignal(left, right, { direction: "ltr", immediate: false });

			return { left, right };
		});
		const ltrInstance = useLtrValues();

		ltrInstance.right.value = "right-before-mount";
		mountMolecule(ltrInstance);

		expect(ltrInstance.left.value).toBe("left");
		expect(ltrInstance.right.value).toBe("right-before-mount");

		disposeMolecule(ltrInstance);

		const useRtlValues = molecule(() => {
			const left = signal("left");
			const right = signal("right");

			syncSignal(left, right, { direction: "rtl", immediate: false });

			return { left, right };
		});
		const rtlInstance = useRtlValues();

		rtlInstance.left.value = "left-before-mount";
		mountMolecule(rtlInstance);

		expect(rtlInstance.left.value).toBe("left-before-mount");
		expect(rtlInstance.right.value).toBe("right");

		disposeMolecule(rtlInstance);
	});

	it("does not reapply setup baselines on molecule remount", () => {
		const useValues = molecule(() => {
			const left = signal(10);
			const right = signal("2");

			syncSignal(left, right, {
				transform: {
					ltr: (value) => String(value * 2),
					rtl: (value) => Number(value) / 4,
				},
			});

			return { left, right };
		});

		const instance = useValues();

		mountMolecule(instance);
		instance.left.value = 8;
		expect(instance.right.value).toBe("16");

		unmountMolecule(instance);
		mountMolecule(instance);

		expect(instance.left.value).toBe(8);
		expect(instance.right.value).toBe("16");

		disposeMolecule(instance);
	});

	it.each(["pre", "post"] as const)(
		"syncs pending %s-flush changes after molecule remount",
		async (flush) => {
			const useValues = molecule(() => {
				const left = signal("left");
				const right = signal("right");

				syncSignal(left, right, { flush });

				return { left, right };
			});

			const instance = useValues();

			mountMolecule(instance);
			instance.left.value = "changed";
			expect(instance.right.value).toBe("left");

			unmountMolecule(instance);
			mountMolecule(instance);

			expect(instance.left.value).toBe("changed");
			expect(instance.right.value).toBe("changed");

			await nextTick();

			expect(instance.left.value).toBe("changed");
			expect(instance.right.value).toBe("changed");

			disposeMolecule(instance);
		},
	);

	it("rejects readonly sources when the type is erased", () => {
		const left = readonly(signal("left"));
		const right = signal("right");

		expect(() => syncSignal(left as unknown as Signal<string>, right)).toThrow(
			TypeError,
		);
	});

	it("rejects computed sources when the type is erased", () => {
		const source = signal("left");
		const left = computed(() => source.value);
		const right = signal("right");

		expect(() => syncSignal(left as unknown as Signal<string>, right)).toThrow(
			TypeError,
		);
	});

	it("rejects writable computed sources when the type is erased", () => {
		const source = signal("left");
		const left = computed({
			get: () => source.value,
			set: (value: string) => {
				source.value = value;
			},
		});
		const right = signal("right");

		expect(() => syncSignal(left as unknown as Signal<string>, right)).toThrow(
			TypeError,
		);
	});

	it("can be imported and created without browser globals", async () => {
		const mod = await import("./index");
		const left = signal("left");
		const right = signal("right");

		mod.syncSignal(left, right);

		expect(globalThis.window).toBeUndefined();
		expect(right.value).toBe("left");
	});
});
