import { afterEach, describe, expect, it, vi } from "vitest";

async function loadEnvironment() {
	vi.resetModules();
	return import("../environment");
}

describe("environment", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
		vi.resetModules();
	});

	it("reads browser globals when available", async () => {
		const environment = await loadEnvironment();

		expect(environment.isClient).toBe(true);
		expect(environment.defaultWindow).toBe(window);
		expect(environment.defaultDocument).toBe(document);
		expect(environment.defaultNavigator).toBe(window.navigator);
	});

	it("stays safe when window is unavailable", async () => {
		vi.stubGlobal("window", undefined);
		vi.stubGlobal("document", undefined);
		vi.stubGlobal("navigator", undefined);

		const environment = await loadEnvironment();

		expect(environment.isClient).toBe(false);
		expect(environment.defaultWindow).toBeUndefined();
		expect(environment.defaultDocument).toBeUndefined();
		expect(environment.defaultNavigator).toBeUndefined();
	});
});
