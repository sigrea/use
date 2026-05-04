// @vitest-environment node

import {
	deepSignal,
	disposeMolecule,
	molecule,
	mountMolecule,
	nextTick,
	signal,
	watchEffect,
} from "@sigrea/core";
import { describe, expect, it } from "vitest";

import { computedWithControl } from "./index";

describe("computedWithControl", () => {
	it("updates only when the explicit source changes", () => {
		const trigger = signal(0);
		const data = signal("foo");
		const value = computedWithControl(trigger, () => data.value.toUpperCase());

		expect(value.value).toBe("FOO");

		data.value = "bar";
		expect(value.value).toBe("FOO");

		trigger.value += 1;
		expect(value.value).toBe("BAR");
	});

	it("does not update when source getter dependencies change without changing the source value", () => {
		const trigger = signal(1);
		const data = signal("foo");
		const value = computedWithControl(
			() => trigger.value > 0,
			() => data.value.toUpperCase(),
		);

		expect(value.value).toBe("FOO");

		data.value = "bar";
		trigger.value = 2;
		expect(value.value).toBe("FOO");

		trigger.value = -1;
		expect(value.value).toBe("BAR");
	});

	it("updates when a source getter returns a new array value", () => {
		const trigger = signal(1);
		const data = signal("foo");
		const value = computedWithControl(
			() => [trigger.value > 0],
			() => data.value.toUpperCase(),
		);

		expect(value.value).toBe("FOO");

		data.value = "bar";
		trigger.value = 2;
		expect(value.value).toBe("BAR");
	});

	it("passes the previous value to the getter", () => {
		const trigger = signal(0);
		const value = computedWithControl(trigger, (oldValue?: number) =>
			oldValue === undefined ? 1 : oldValue * 2,
		);

		expect(value.value).toBe(1);

		trigger.value += 1;
		expect(value.value).toBe(2);

		trigger.value += 1;
		expect(value.value).toBe(4);
	});

	it("supports manual triggering", () => {
		let count = 0;
		const value = computedWithControl(
			() => count,
			() => count,
		);

		expect(value.value).toBe(0);

		count += 1;
		expect(value.value).toBe(0);

		value.trigger();
		expect(value.value).toBe(1);
	});

	it("supports writable values", () => {
		const trigger = signal(0);
		const data = signal("foo");
		const value = computedWithControl(trigger, {
			get: () => data.value.toUpperCase(),
			set: (next) => {
				data.value = next;
			},
		});

		expect(value.value).toBe("FOO");

		data.value = "bar";
		expect(value.value).toBe("FOO");

		trigger.value += 1;
		expect(value.value).toBe("BAR");

		value.value = "BAZ";
		expect(data.value).toBe("BAZ");
	});

	it("does not notify dependents when getter dependencies change", async () => {
		const trigger = signal(0);
		const data = signal("foo");
		const value = computedWithControl(trigger, () => data.value.toUpperCase());
		let updates = 0;

		watchEffect(() => {
			value.value;
			updates += 1;
		});

		data.value = "bar";
		await nextTick();
		expect(updates).toBe(1);

		trigger.value += 1;
		await nextTick();
		expect(updates).toBe(2);
		expect(value.value).toBe("BAR");
	});

	it("can be used as a watch source", async () => {
		const trigger = signal(0);
		const data = signal("foo");
		const value = computedWithControl(trigger, () => data.value.toUpperCase());
		const updates: string[] = [];

		watchEffect(() => {
			updates.push(value.value);
		});

		data.value = "bar";
		await nextTick();
		expect(updates).toEqual(["FOO"]);

		trigger.value += 1;
		await nextTick();
		expect(updates).toEqual(["FOO", "BAR"]);
	});

	it("watches deep signal sources shallowly by default", () => {
		const source = deepSignal({ nested: { count: 1 } });
		const value = computedWithControl(source, () => source.nested.count);

		expect(value.value).toBe(1);

		source.nested.count = 2;
		expect(value.value).toBe(1);

		source.nested = { count: 3 };
		expect(value.value).toBe(3);
	});

	it("treats deep signal arrays as a single shallow source by default", () => {
		const source = deepSignal([{ count: 1 }]);
		const value = computedWithControl(source, () => source[0]?.count ?? 0);

		expect(value.value).toBe(1);

		source[0].count = 2;
		expect(value.value).toBe(1);

		source.push({ count: 3 });
		expect(value.value).toBe(2);
	});

	it("can deep watch deep signal sources", () => {
		const source = deepSignal({ nested: { count: 1 } });
		const value = computedWithControl(source, () => source.nested.count, {
			deep: true,
		});

		expect(value.value).toBe(1);

		source.nested.count = 2;
		expect(value.value).toBe(2);
	});

	it("can watch multiple sources", () => {
		const first = signal(1);
		const second = signal("2");
		const value = computedWithControl(
			[first, second],
			() => `${first.value}${second.value}`,
		);

		expect(value.value).toBe("12");

		first.value = 2;
		expect(value.value).toBe("22");

		second.value = "3";
		expect(value.value).toBe("23");
	});

	it("respects async flush options", async () => {
		const trigger = signal(0);
		const data = signal("foo");
		const value = computedWithControl(trigger, () => data.value.toUpperCase(), {
			flush: "pre",
		});

		expect(value.value).toBe("FOO");

		data.value = "bar";
		trigger.value += 1;

		expect(value.value).toBe("FOO");

		await nextTick();

		expect(value.value).toBe("BAR");
	});

	it("updates from explicit sources during molecule setup before mount", () => {
		const UseValue = molecule(() => {
			const trigger = signal(0);
			const data = signal("foo");
			const value = computedWithControl(trigger, () =>
				data.value.toUpperCase(),
			);

			return { data, trigger, value };
		});

		const instance = UseValue();

		expect(instance.value.value).toBe("FOO");

		instance.data.value = "bar";
		expect(instance.value.value).toBe("FOO");

		instance.trigger.value += 1;
		expect(instance.value.value).toBe("BAR");

		mountMolecule(instance);
		instance.data.value = "baz";
		expect(instance.value.value).toBe("BAR");

		instance.trigger.value += 1;
		expect(instance.value.value).toBe("BAZ");

		disposeMolecule(instance);
	});

	it("keeps pre-flush setup reads current until molecule mount", async () => {
		const UseValue = molecule(() => {
			const trigger = signal(0);
			const data = signal("foo");
			const value = computedWithControl(
				trigger,
				() => data.value.toUpperCase(),
				{ flush: "pre" },
			);

			return { data, trigger, value };
		});

		const instance = UseValue();

		expect(instance.value.value).toBe("FOO");

		instance.data.value = "bar";
		instance.trigger.value += 1;
		expect(instance.value.value).toBe("BAR");

		mountMolecule(instance);
		await nextTick();
		expect(instance.value.value).toBe("BAR");

		instance.data.value = "baz";
		instance.trigger.value += 1;
		expect(instance.value.value).toBe("BAR");

		await nextTick();
		expect(instance.value.value).toBe("BAZ");

		disposeMolecule(instance);
	});

	it("keeps deep signal source reads current until molecule mount", () => {
		const UseValue = molecule(() => {
			const source = deepSignal({ nested: { count: 1 } });
			const value = computedWithControl(source, () => source.nested.count);

			return { source, value };
		});

		const instance = UseValue();

		expect(instance.value.value).toBe(1);

		instance.source.nested.count = 2;
		expect(instance.value.value).toBe(1);

		instance.source.nested = { count: 3 };
		expect(instance.value.value).toBe(3);

		disposeMolecule(instance);
	});

	it("tracks object identity for shallow source reads until molecule mount", () => {
		const UseValue = molecule(() => {
			const source = deepSignal({ nested: { count: 1 } });
			const value = computedWithControl(source, () => source.nested);

			return { source, value };
		});

		const instance = UseValue();
		const initialNested = instance.value.value;

		expect(initialNested.count).toBe(1);

		instance.source.nested = { count: 1 };

		expect(instance.value.value).not.toBe(initialNested);
		expect(instance.value.value.count).toBe(1);

		disposeMolecule(instance);
	});

	it("keeps deep watched source reads current until molecule mount", () => {
		const UseValue = molecule(() => {
			const source = deepSignal({ nested: { count: 1 } });
			const value = computedWithControl(source, () => source.nested.count, {
				deep: true,
			});

			return { source, value };
		});

		const instance = UseValue();

		expect(instance.value.value).toBe(1);

		instance.source.nested.count = 2;
		expect(instance.value.value).toBe(2);

		disposeMolecule(instance);
	});

	it("tracks object identity for deep source reads until molecule mount", () => {
		const UseValue = molecule(() => {
			const source = deepSignal({ nested: { count: 1 } });
			const value = computedWithControl(source, () => source.nested, {
				deep: true,
			});

			return { source, value };
		});

		const instance = UseValue();
		const initialNested = instance.value.value;

		expect(initialNested.count).toBe(1);

		instance.source.nested = { count: 1 };

		expect(instance.value.value).not.toBe(initialNested);
		expect(instance.value.value.count).toBe(1);

		disposeMolecule(instance);
	});

	it("keeps deep signal array source reads current until molecule mount", () => {
		const UseValue = molecule(() => {
			const source = deepSignal([{ count: 1 }]);
			const value = computedWithControl(source, () => source[0]?.count ?? 0);

			return { source, value };
		});

		const instance = UseValue();

		expect(instance.value.value).toBe(1);

		instance.source[0].count = 2;
		expect(instance.value.value).toBe(1);

		instance.source.push({ count: 3 });
		expect(instance.value.value).toBe(2);

		disposeMolecule(instance);
	});

	it("tracks array entry identity for shallow source reads until molecule mount", () => {
		const UseValue = molecule(() => {
			const source = deepSignal([{ count: 1 }]);
			const value = computedWithControl(source, () => source[0]);

			return { source, value };
		});

		const instance = UseValue();
		const initialEntry = instance.value.value;

		expect(initialEntry?.count).toBe(1);

		instance.source[0] = { count: 1 };

		expect(instance.value.value).not.toBe(initialEntry);
		expect(instance.value.value?.count).toBe(1);

		disposeMolecule(instance);
	});

	it("keeps deep watched getter source reads current until molecule mount", () => {
		const UseValue = molecule(() => {
			const source = deepSignal({ count: 1 });
			const value = computedWithControl(
				() => source,
				() => source.count,
				{
					deep: true,
				},
			);

			return { source, value };
		});

		const instance = UseValue();

		expect(instance.value.value).toBe(1);

		instance.source.count = 2;
		expect(instance.value.value).toBe(2);

		disposeMolecule(instance);
	});

	it("does not refresh pre-flush setup reads when the source value is unchanged", async () => {
		const UseValue = molecule(() => {
			const trigger = signal(1);
			const data = signal("foo");
			const value = computedWithControl(
				() => trigger.value > 0,
				() => data.value.toUpperCase(),
				{ flush: "pre" },
			);

			return { data, trigger, value };
		});

		const instance = UseValue();

		expect(instance.value.value).toBe("FOO");

		instance.data.value = "bar";
		instance.trigger.value = 2;
		expect(instance.value.value).toBe("FOO");

		instance.trigger.value = -1;
		expect(instance.value.value).toBe("BAR");

		mountMolecule(instance);
		await nextTick();
		expect(instance.value.value).toBe("BAR");

		disposeMolecule(instance);
	});

	it("updates pre-flush setup reads when a source getter returns a new array value", async () => {
		const UseValue = molecule(() => {
			const trigger = signal(1);
			const data = signal("foo");
			const value = computedWithControl(
				() => [trigger.value > 0],
				() => data.value.toUpperCase(),
				{ flush: "pre" },
			);

			return { data, trigger, value };
		});

		const instance = UseValue();

		expect(instance.value.value).toBe("FOO");

		instance.data.value = "bar";
		instance.trigger.value = 2;
		expect(instance.value.value).toBe("BAR");

		disposeMolecule(instance);
	});

	it("can be imported and created without browser globals", async () => {
		const mod = await import("./index");
		const source = signal(0);
		const value = mod.computedWithControl(source, () => "ready");

		expect(globalThis.window).toBeUndefined();
		expect(value.value).toBe("ready");
	});
});
