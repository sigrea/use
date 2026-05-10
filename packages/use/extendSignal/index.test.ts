// @vitest-environment node

import { computed, readonly, signal } from "@sigrea/core";
import { describe, expect, it } from "vitest";

import { extendSignal } from "./index";

describe("extendSignal", () => {
	it("returns the original signal and adds non-enumerable properties by default", () => {
		const source = signal("content");
		const extended = extendSignal(source, { label: "extra data" });

		expect(extended).toBe(source);
		expect(extended.value).toBe("content");
		expect(extended.label).toBe("extra data");
		expect(Object.getOwnPropertyDescriptor(source, "label")).toMatchObject({
			enumerable: false,
			value: "extra data",
		});
	});

	it("respects enumerable option", () => {
		const source = signal("content");

		extendSignal(source, { label: "extra data" }, { enumerable: true });

		expect(Object.getOwnPropertyDescriptor(source, "label")).toMatchObject({
			enumerable: true,
		});
	});

	it("does not overwrite the signal value or peek", () => {
		const source = signal("content");
		const peek = source.peek;
		const extended = extendSignal(source, {
			label: "extra data",
			peek: () => "ignored",
			value: "ignored",
		});

		expect(extended.value).toBe("content");
		expect(extended.peek).toBe(peek);
		expect(extended.peek()).toBe("content");
		expect(extended.label).toBe("extra data");
	});

	it("unwraps writable signal properties", () => {
		const source = signal("content");
		const extra = signal("extra");
		const extended = extendSignal(source, { extra });

		expect(extended.extra).toBe("extra");

		extra.value = "changed";
		expect(extended.extra).toBe("changed");

		extended.extra = "new data";
		expect(extra.value).toBe("new data");
	});

	it("unwraps computed and readonly signal properties", () => {
		const source = signal("content");
		const count = signal(1);
		const doubled = computed(() => count.value * 2);
		const writable = computed({
			get: () => count.value,
			set: (next) => {
				count.value = next;
			},
		});
		const exposed = readonly(count);
		const extended = extendSignal(source, { doubled, exposed, writable });

		expect(extended.doubled).toBe(2);
		expect(extended.exposed).toBe(1);

		count.value = 3;
		expect(extended.doubled).toBe(6);
		expect(extended.exposed).toBe(3);

		extended.writable = 4;
		expect(count.value).toBe(4);
		expect(Object.getOwnPropertyDescriptor(source, "exposed")?.set).toBe(
			undefined,
		);
	});

	it("keeps original signal objects when unwrap is false", () => {
		const source = signal("content");
		const extra = signal("extra");
		const doubled = computed(() => extra.value.length * 2);
		const exposed = readonly(extra);
		const extended = extendSignal(
			source,
			{ doubled, exposed, extra },
			{ unwrap: false },
		);

		expect(extended.extra).toBe(extra);
		expect(extended.doubled).toBe(doubled);
		expect(extended.exposed).toBe(exposed);
		expect(extended.extra.value).toBe("extra");
	});

	it("can be imported and used without browser globals", async () => {
		const mod = await import("./index");
		const source = signal("ready");
		const extra = signal("extra");
		const extended = mod.extendSignal(source, { extra });

		expect(globalThis.window).toBeUndefined();
		expect(extended.extra).toBe("extra");
	});
});
