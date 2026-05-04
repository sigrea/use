// @vitest-environment node

import {
	computed,
	isSignal,
	nextTick,
	readonly,
	signal,
	watchEffect,
} from "@sigrea/core";
import type { Signal } from "@sigrea/core";
import { describe, expect, it } from "vitest";

import { resolveValue } from "../resolveValue";
import { signalDefault } from "./index";

describe("signalDefault", () => {
	it("uses the source value when it is defined", () => {
		const source = signal<string | undefined>("source");
		const value = signalDefault(source, "default");

		expect(value.value).toBe("source");
	});

	it("uses the default value when the source is nullish", () => {
		const source = signal<string | null | undefined>();
		const value = signalDefault(source, "default");

		expect(value.value).toBe("default");

		source.value = null;
		expect(value.value).toBe("default");
	});

	it("allows nullish defaults when the source type includes them", () => {
		const nullValue = signalDefault(signal<string | null | undefined>(), null);
		const undefinedValue = signalDefault(
			signal<string | null | undefined>(),
			undefined,
		);

		expect(nullValue.value).toBeNull();
		expect(undefinedValue.value).toBeUndefined();

		nullValue.value = "source";
		undefinedValue.value = "source";

		expect(nullValue.value).toBe("source");
		expect(undefinedValue.value).toBe("source");
	});

	it("keeps falsy source values", () => {
		expect(signalDefault(signal<number | undefined>(0), 1).value).toBe(0);
		expect(signalDefault(signal<boolean | undefined>(false), true).value).toBe(
			false,
		);
		expect(signalDefault(signal<string | undefined>(""), "default").value).toBe(
			"",
		);
	});

	it("writes assignments back to the source", () => {
		const source = signal<string | undefined>();
		const value = signalDefault(source, "default");

		value.value = "updated";

		expect(source.value).toBe("updated");
		expect(value.value).toBe("updated");
	});

	it("reacts to source changes", async () => {
		const source = signal<string | undefined>();
		const value = signalDefault(source, "default");
		const calls: string[] = [];

		watchEffect(() => {
			calls.push(value.value);
		});

		source.value = "source";
		await nextTick();
		source.value = undefined;
		await nextTick();

		expect(calls).toEqual(["default", "source", "default"]);
	});

	it("keeps function defaults as values", () => {
		const fallback = () => "default";
		const value = signalDefault(signal<(() => string) | undefined>(), fallback);

		expect(value.value).toBe(fallback);
		expect(value.value()).toBe("default");
	});

	it("returns a core signal-compatible value", () => {
		const value = signalDefault(signal<string | undefined>(), "default");

		expect(isSignal(value)).toBe(true);
		expect(resolveValue(value)).toBe("default");
	});

	it("rejects readonly sources when the type is erased", () => {
		const source = readonly(signal<string | undefined>());

		expect(() =>
			signalDefault(source as unknown as Signal<string | undefined>, "default"),
		).toThrow(TypeError);
	});

	it("rejects computed sources when the type is erased", () => {
		const source = signal<string | undefined>();
		const computedSource = computed(() => source.value);

		expect(() =>
			signalDefault(
				computedSource as unknown as Signal<string | undefined>,
				"default",
			),
		).toThrow(TypeError);
	});
});
