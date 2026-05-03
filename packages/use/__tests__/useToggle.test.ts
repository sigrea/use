import { signal } from "@sigrea/core";
import { describe, expect, it } from "vitest";

import { useToggle } from "../useToggle";

describe("useToggle", () => {
	it("toggles and sets explicit boolean values", () => {
		const toggle = useToggle();

		expect(toggle.value.value).toBe(false);
		expect(toggle.toggle()).toBe(true);
		expect(toggle.value.value).toBe(true);

		toggle.set(false);
		expect(toggle.value.value).toBe(false);

		expect(toggle.toggle(true)).toBe(true);
		expect(toggle.value.value).toBe(true);
	});

	it("supports custom truthy and falsy values", () => {
		const toggle = useToggle<"on", "off">("off", {
			falsyValue: "off",
			truthyValue: "on",
		});

		expect(toggle.value.value).toBe("off");
		expect(toggle.toggle()).toBe("on");
		expect(toggle.value.value).toBe("on");

		expect(toggle.toggle()).toBe("off");
		expect(toggle.value.value).toBe("off");
	});

	it("uses the custom falsy value when the initial value is omitted", () => {
		const toggle = useToggle(undefined, {
			falsyValue: "off",
			truthyValue: "on",
		});

		expect(toggle.value.value).toBe("off");
		expect(toggle.toggle()).toBe("on");
		expect(toggle.value.value).toBe("on");
	});

	it("reads the initial value once when a signal is passed", () => {
		const initialValue = signal(false);
		const toggle = useToggle(initialValue);

		expect(toggle.value.value).toBe(false);

		initialValue.value = true;
		expect(toggle.value.value).toBe(false);
		expect(toggle.toggle()).toBe(true);
	});
});
