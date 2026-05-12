// @vitest-environment node

import {
	disposeMolecule,
	molecule,
	mountMolecule,
	signal,
	unmountMolecule,
} from "@sigrea/core";
import { describe, expect, it } from "vitest";

import { useSupported } from "./index";

describe("useSupported", () => {
	it("returns a boolean signal from the callback result", () => {
		const source = signal<unknown>("available");
		const isSupported = useSupported(() => source.value);

		expect(isSupported.value).toBe(true);

		source.value = "";
		expect(isSupported.value).toBe(false);
	});

	it("reruns the callback when the molecule is mounted", () => {
		let supported = false;
		let calls = 0;
		const useFeatureSupport = molecule(() => {
			const isSupported = useSupported(() => {
				calls += 1;
				return supported;
			});

			return { isSupported };
		});
		const instance = useFeatureSupport();

		expect(instance.isSupported.value).toBe(false);
		expect(calls).toBe(1);

		supported = true;
		mountMolecule(instance);

		expect(instance.isSupported.value).toBe(true);
		expect(calls).toBe(2);

		supported = false;
		unmountMolecule(instance);

		expect(instance.isSupported.value).toBe(false);
		expect(calls).toBe(3);

		supported = true;
		mountMolecule(instance);

		expect(instance.isSupported.value).toBe(true);
		expect(calls).toBe(4);

		supported = false;
		disposeMolecule(instance);

		expect(instance.isSupported.value).toBe(false);
		expect(calls).toBe(5);
	});

	it("propagates callback errors", () => {
		const error = new Error("feature detection failed");
		const isSupported = useSupported(() => {
			throw error;
		});

		expect(() => isSupported.value).toThrow(error);
	});
});
