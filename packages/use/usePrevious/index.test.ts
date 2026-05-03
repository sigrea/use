import {
	disposeTrackedMolecules,
	molecule,
	mountMolecule,
	signal,
	trackMolecule,
} from "@sigrea/core";
import { afterEach, describe, expect, it } from "vitest";

import { usePrevious } from "./index";

describe("usePrevious", () => {
	afterEach(() => {
		disposeTrackedMolecules();
	});

	it("returns undefined until the source changes", () => {
		const source = signal(1);
		const previous = usePrevious(source);

		expect(previous.value).toBeUndefined();

		source.value = 2;
		expect(previous.value).toBe(1);

		source.value = 10;
		expect(previous.value).toBe(2);
	});

	it("uses the provided initial value", () => {
		const source = signal("Hello");
		const previous = usePrevious(() => source.value, "initial");

		expect(previous.value).toBe("initial");

		source.value = "World";

		expect(previous.value).toBe("Hello");
	});

	it("tracks the previous object reference when the source is replaced", () => {
		const source = signal<{ a?: number; b?: number }>({ a: 1 });
		const previous = usePrevious(source);

		source.value.a = 2;
		expect(previous.value).toBeUndefined();

		source.value = { b: 2 };

		expect(previous.value).toEqual({ a: 2 });
	});

	it("keeps the initial value during molecule setup", () => {
		const PreviousMolecule = molecule(() => {
			const source = signal("ready");
			return {
				source,
				previous: usePrevious(source, "initial"),
			};
		});
		const instance = PreviousMolecule();
		trackMolecule(instance);

		expect(instance.previous.value).toBe("initial");

		mountMolecule(instance);
		instance.source.value = "mounted";

		expect(instance.previous.value).toBe("ready");
	});
});
