// @vitest-environment node

import { describe, expect, it } from "vitest";

describe("SSR safety", () => {
	it("imports the root entry in a node environment", async () => {
		const mod = await import("../../../index");

		expect(typeof mod.useCounter).toBe("function");
		expect(typeof mod.useEventListener).toBe("function");
		expect(typeof mod.useWindowSize).toBe("function");
	});

	it("creates browser composables without a window", async () => {
		const { useEventListener, useMediaQuery, useWindowSize } = await import(
			"../../../index"
		);

		const listener = useEventListener("resize", () => {});
		const mediaQuery = useMediaQuery("(min-width: 640px)");
		const size = useWindowSize();

		expect(mediaQuery.matches.value).toBe(false);
		expect(size.width.value).toBe(0);
		expect(size.height.value).toBe(0);

		listener.stop();
		mediaQuery.stop();
		size.stop();
	});
});
