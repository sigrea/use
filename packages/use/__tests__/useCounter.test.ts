import { signal } from "@sigrea/core";
import { describe, expect, it } from "vitest";

import { useCounter } from "../useCounter";

describe("useCounter", () => {
	it("increments, decrements, and resets within bounds", () => {
		const counter = useCounter(2, { min: 0, max: 4, step: 2 });

		counter.inc();
		expect(counter.count.value).toBe(4);

		counter.inc();
		expect(counter.count.value).toBe(4);

		counter.dec();
		expect(counter.count.value).toBe(2);

		counter.set(-10);
		expect(counter.count.value).toBe(0);

		expect(counter.get()).toBe(0);
		expect(counter.reset()).toBe(2);
		expect(counter.count.value).toBe(2);
		expect(counter.reset(4)).toBe(4);
		expect(counter.count.value).toBe(4);
	});

	it("clamps explicit deltas and reset values", () => {
		const counter = useCounter(1, { min: 0, max: 5, step: 2 });

		counter.inc(10);
		expect(counter.count.value).toBe(5);

		counter.dec(10);
		expect(counter.count.value).toBe(0);

		expect(counter.reset(9)).toBe(5);
		expect(counter.count.value).toBe(5);
	});

	it("reads the initial value once when a signal is passed", () => {
		const initialValue = signal(3);
		const counter = useCounter(initialValue, { min: 0, max: 10 });

		expect(counter.count.value).toBe(3);

		initialValue.value = 7;
		expect(counter.count.value).toBe(3);
		expect(counter.reset()).toBe(3);
	});
});
