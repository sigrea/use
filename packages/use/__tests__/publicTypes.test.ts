import { signal } from "@sigrea/core";
import { describe, expectTypeOf, it } from "vitest";

import type {
	MatchMediaWindow,
	UseMediaQueryOptions,
	UseToggleOptions,
	UseWindowSizeOptions,
} from "../types";
import { useEventListener } from "../useEventListener";
import { useMediaQuery } from "../useMediaQuery";
import { useToggle } from "../useToggle";
import { useWindowSize } from "../useWindowSize";

interface MatchMediaOnlyWindow extends MatchMediaWindow {
	readonly label: string;
}

interface SizedWindow extends EventTarget {
	readonly innerWidth: number;
	readonly innerHeight: number;
}

describe("public types", () => {
	it("infers window event payloads when the target is omitted", () => {
		useEventListener("resize", (event) => {
			expectTypeOf(event).toEqualTypeOf<UIEvent>();
		});
	});

	it("preserves DOM event payload types", () => {
		const button = document.createElement("button");

		useEventListener(button, "click", (event) => {
			expectTypeOf(event).toEqualTypeOf<PointerEvent>();
		});
	});

	it("accepts lightweight matchMedia windows", () => {
		const queryList = new EventTarget() as MediaQueryList;
		Object.defineProperties(queryList, {
			matches: { value: true, writable: true },
			media: { value: "(min-width: 1px)" },
			onchange: { value: null, writable: true },
		});

		const customWindow = {
			label: "test",
			matchMedia: (_query: string) => queryList,
		} satisfies MatchMediaOnlyWindow;

		const options: UseMediaQueryOptions<MatchMediaOnlyWindow> = {
			window: signal(customWindow),
		};

		useMediaQuery("(min-width: 768px)", options);
	});

	it("accepts reactive window-like targets for window size", () => {
		const sizedWindow = new EventTarget() as SizedWindow;
		Object.defineProperties(sizedWindow, {
			innerHeight: { value: 600, writable: true },
			innerWidth: { value: 800, writable: true },
		});

		const options: UseWindowSizeOptions<SizedWindow> = {
			window: signal(sizedWindow),
		};

		useWindowSize(options);
	});

	it("infers custom toggle values", () => {
		const options: UseToggleOptions<"on", "off"> = {
			falsyValue: "off",
			truthyValue: "on",
		};
		const toggle = useToggle("off", options);

		expectTypeOf(toggle.value.value).toEqualTypeOf<"on" | "off">();
	});

	it("infers custom toggle values when the initial value is omitted", () => {
		const toggle = useToggle(undefined, {
			falsyValue: "off",
			truthyValue: "on",
		});

		expectTypeOf(toggle.value.value).toEqualTypeOf<"on" | "off">();
	});

	it("requires options for custom toggle values", () => {
		// @ts-expect-error custom values require truthy/falsy options
		useToggle("off");
	});
});
