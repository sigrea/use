// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

describe("SSR safety", () => {
	it("imports the shared entry in a node environment", async () => {
		const mod = await import("../index");

		expect(mod.isClient).toBe(false);
		expect(mod.defaultWindow).toBeUndefined();
		expect(typeof mod.listen).toBe("function");
		expect(typeof mod.watchMediaQuery).toBe("function");
	});

	it("treats media query watchers as no-ops when window is unavailable", async () => {
		const { watchMediaQuery } = await import("../index");
		const listener = vi.fn();

		const stop = watchMediaQuery("(min-width: 640px)", listener);

		expect(listener).not.toHaveBeenCalled();
		stop();
	});
});
