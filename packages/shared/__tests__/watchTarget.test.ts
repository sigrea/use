import { createScope, disposeScope, runWithScope, signal } from "@sigrea/core";
import { describe, expect, expectTypeOf, it } from "vitest";

import { watchTarget } from "../watchTarget";

describe("watchTarget", () => {
	it("runs immediately, retargets, and cleans up the previous target", () => {
		const first = new EventTarget();
		const second = new EventTarget();
		const target = signal<EventTarget | null>(first);
		const calls: string[] = [];

		const stop = watchTarget(target, (currentTarget) => {
			calls.push(currentTarget === first ? "start:first" : "start:second");

			return () => {
				calls.push(currentTarget === first ? "stop:first" : "stop:second");
			};
		});

		expect(calls).toEqual(["start:first"]);

		target.value = second;

		expect(calls).toEqual(["start:first", "stop:first", "start:second"]);

		target.value = null;

		expect(calls).toEqual([
			"start:first",
			"stop:first",
			"start:second",
			"stop:second",
		]);

		stop();

		expect(calls).toEqual([
			"start:first",
			"stop:first",
			"start:second",
			"stop:second",
		]);
	});

	it("cleans up automatically with the active scope", () => {
		const target = new EventTarget();
		const calls: string[] = [];
		const scope = createScope();

		runWithScope(scope, () => {
			watchTarget(target, () => {
				calls.push("start");
				return () => {
					calls.push("stop");
				};
			});
		});

		expect(calls).toEqual(["start"]);

		disposeScope(scope);

		expect(calls).toEqual(["start", "stop"]);
	});

	it("ignores missing targets until one becomes available", () => {
		const target = signal<EventTarget | null>(null);
		let calls = 0;
		const stop = watchTarget(target, () => {
			calls += 1;
		});

		expect(calls).toBe(0);

		target.value = new EventTarget();

		expect(calls).toBe(1);

		stop();
	});

	it("passes a non-null target type to the callback", () => {
		const target = signal<HTMLButtonElement | null>(
			document.createElement("button"),
		);
		const stop = watchTarget(target, (currentTarget) => {
			expectTypeOf(currentTarget).toEqualTypeOf<HTMLButtonElement>();
		});

		stop();
	});
});
