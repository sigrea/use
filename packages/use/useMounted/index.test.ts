// @vitest-environment node

import {
	disposeMolecule,
	molecule,
	mountMolecule,
	unmountMolecule,
} from "@sigrea/core";
import { describe, expect, it } from "vitest";

import { useMounted } from "./index";

describe("useMounted", () => {
	it("returns false when called outside a molecule setup", () => {
		const mounted = useMounted();

		expect(mounted.value).toBe(false);
	});

	it("tracks the current molecule mount state", () => {
		const useMountedState = molecule(() => {
			const mounted = useMounted();

			return { mounted };
		});
		const instance = useMountedState();

		expect(instance.mounted.value).toBe(false);

		mountMolecule(instance);

		expect(instance.mounted.value).toBe(true);

		unmountMolecule(instance);

		expect(instance.mounted.value).toBe(false);

		mountMolecule(instance);

		expect(instance.mounted.value).toBe(true);

		disposeMolecule(instance);

		expect(instance.mounted.value).toBe(false);
	});
});
