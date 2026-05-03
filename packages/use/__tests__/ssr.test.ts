// @vitest-environment node

import { describe, expect, it } from "vitest";

describe("SSR safety", () => {
	it("imports the root entry in a node environment", async () => {
		const mod = await import("../../../index");

		expect(typeof mod.useCounter).toBe("function");
		expect(typeof mod.useEventListener).toBe("function");
		expect(typeof mod.useIntervalFn).toBe("function");
		expect(typeof mod.useMediaQuery).toBe("function");
		expect(typeof mod.useTimeoutFn).toBe("function");
		expect(typeof mod.useToggle).toBe("function");
		expect(typeof mod.useWindowSize).toBe("function");
	});

	it("creates browser composables without a window", async () => {
		const { useEventListener, useMediaQuery, useWindowSize } = await import(
			"../../../index"
		);

		const listener = useEventListener("resize", () => {});
		const mediaQuery = useMediaQuery("(min-width: 640px)");
		const ssrMediaQuery = useMediaQuery("(min-width: 640px)", {
			ssrWidth: 800,
		});
		const size = useWindowSize();

		expect(mediaQuery.matches.value).toBe(false);
		expect(ssrMediaQuery.matches.value).toBe(true);
		expect(size.width.value).toBe(0);
		expect(size.height.value).toBe(0);

		listener.stop();
		mediaQuery.stop();
		ssrMediaQuery.stop();
		size.stop();
	});
});
