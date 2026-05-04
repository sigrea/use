// @vitest-environment node

import {
	createScope,
	disposeMolecule,
	disposeScope,
	molecule,
	mountMolecule,
	onMount,
	runWithScope,
	unmountMolecule,
} from "@sigrea/core";
import { describe, expect, it } from "vitest";

import { tryOnScopeDispose } from "./index";

describe("tryOnScopeDispose", () => {
	it("returns false without running cleanup when no scope is active", () => {
		const calls: string[] = [];
		const registered = tryOnScopeDispose(() => {
			calls.push("cleanup");
		});

		expect(registered).toBe(false);
		expect(calls).toEqual([]);
	});

	it("registers cleanup in the active scope", () => {
		const scope = createScope();
		const calls: string[] = [];
		const registered = runWithScope(scope, () =>
			tryOnScopeDispose(() => {
				calls.push("cleanup");
			}),
		);

		expect(registered).toBe(true);
		expect(calls).toEqual([]);

		disposeScope(scope);

		expect(calls).toEqual(["cleanup"]);
	});

	it("runs cleanups in Sigrea scope disposal order", () => {
		const scope = createScope();
		const calls: string[] = [];

		runWithScope(scope, () => {
			tryOnScopeDispose(() => {
				calls.push("first");
			});
			tryOnScopeDispose(() => {
				calls.push("second");
			});
		});

		disposeScope(scope);

		expect(calls).toEqual(["second", "first"]);
	});

	it("registers cleanup during molecule setup", () => {
		const calls: string[] = [];
		const UseCleanup = molecule(() => {
			const registered = tryOnScopeDispose(() => {
				calls.push("dispose");
			});

			return { registered };
		});
		const instance = UseCleanup();

		expect(instance.registered).toBe(true);
		expect(calls).toEqual([]);

		mountMolecule(instance);
		unmountMolecule(instance);

		expect(calls).toEqual([]);

		disposeMolecule(instance);

		expect(calls).toEqual(["dispose"]);
	});

	it("registers cleanup during molecule mount", () => {
		const calls: string[] = [];
		const UseCleanup = molecule(() => {
			onMount(() => {
				tryOnScopeDispose(() => {
					calls.push("unmount");
				});
			});

			return {};
		});
		const instance = UseCleanup();

		mountMolecule(instance);
		expect(calls).toEqual([]);

		unmountMolecule(instance);

		expect(calls).toEqual(["unmount"]);
	});

	it("can be imported and called without browser globals", async () => {
		const mod = await import("./index");

		expect(globalThis.window).toBeUndefined();
		expect(mod.tryOnScopeDispose(() => {})).toBe(false);
	});
});
