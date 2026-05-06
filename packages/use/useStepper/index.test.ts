// @vitest-environment node

import {
	computed,
	disposeTrackedMolecules,
	readonly,
	signal,
} from "@sigrea/core";
import { afterEach, describe, expect, it } from "vitest";

import { useStepper } from "./index";

describe("useStepper", () => {
	afterEach(() => {
		disposeTrackedMolecules();
	});

	it("navigates through object steps", () => {
		const stepper = useStepper({
			first: "First",
			second: "Second",
			last: "Last",
		});

		expect(stepper.steps.value).toEqual({
			first: "First",
			second: "Second",
			last: "Last",
		});
		expect(stepper.stepNames.value).toEqual(["first", "second", "last"]);
		expect(stepper.index.value).toBe(0);
		expect(stepper.current.value).toBe("First");
		expect(stepper.previous.value).toBeUndefined();
		expect(stepper.next.value).toBe("second");
		expect(stepper.isFirst.value).toBe(true);
		expect(stepper.isLast.value).toBe(false);

		stepper.goToPrevious();
		expect(stepper.current.value).toBe("First");

		stepper.goToNext();
		expect(stepper.current.value).toBe("Second");
		expect(stepper.index.value).toBe(1);
		expect(stepper.previous.value).toBe("first");
		expect(stepper.next.value).toBe("last");

		stepper.goToNext();
		stepper.goToNext();
		expect(stepper.current.value).toBe("Last");
		expect(stepper.isLast.value).toBe(true);

		stepper.goBackTo("first");
		expect(stepper.current.value).toBe("First");

		stepper.goBackTo("last");
		expect(stepper.current.value).toBe("First");

		stepper.goTo("last");
		expect(stepper.current.value).toBe("Last");
	});

	it("supports array steps and writable index", () => {
		const stepper = useStepper(["first", "second", "last"] as const, "last");

		expect(stepper.steps.value).toEqual(["first", "second", "last"]);
		expect(stepper.stepNames.value).toEqual(["first", "second", "last"]);
		expect(stepper.current.value).toBe("last");
		expect(stepper.index.value).toBe(2);

		stepper.index.value = 1;
		expect(stepper.current.value).toBe("second");

		stepper.index.value = 99;
		expect(stepper.current.value).toBe("second");

		expect(stepper.at(0)).toBe("first");
		expect(stepper.at(2)).toBe("last");
		expect(stepper.at(3)).toBeUndefined();
		expect(stepper.get("first")).toBe("first");
		expect(stepper.get("missing" as "first")).toBeUndefined();
	});

	it("can tell the current step position", () => {
		const stepper = useStepper({
			first: "First",
			second: "Second",
			last: "Last",
		});

		expect(stepper.isCurrent("first")).toBe(true);
		expect(stepper.isNext("second")).toBe(true);
		expect(stepper.isPrevious("first")).toBe(false);
		expect(stepper.isBefore("last")).toBe(true);
		expect(stepper.isAfter("first")).toBe(false);

		stepper.goTo("second");

		expect(stepper.isCurrent("second")).toBe(true);
		expect(stepper.isPrevious("first")).toBe(true);
		expect(stepper.isNext("last")).toBe(true);
		expect(stepper.isBefore("last")).toBe(true);
		expect(stepper.isAfter("first")).toBe(true);

		stepper.goTo("last");

		expect(stepper.isLast.value).toBe(true);
		expect(stepper.isBefore("last")).toBe(false);
		expect(stepper.isAfter("second")).toBe(true);
	});

	it("does not navigate to missing steps", () => {
		const stepper = useStepper({
			first: "First",
			second: "Second",
		});

		stepper.goTo("missing" as "first");

		expect(stepper.current.value).toBe("First");
		expect(stepper.get("missing" as "first")).toBeUndefined();
		expect(stepper.isCurrent("missing" as "first")).toBe(false);
		expect(stepper.isNext("missing" as "first")).toBe(false);
		expect(stepper.isPrevious("missing" as "first")).toBe(false);
		expect(stepper.isBefore("missing" as "first")).toBe(false);
		expect(stepper.isAfter("missing" as "first")).toBe(false);
	});

	it("resolves MaybeValue sources and step values", () => {
		const first = signal("first");
		const second = computed(() => "second");
		const arraySource = signal([first, second, () => "last"] as const);
		const arrayStepper = useStepper(readonly(arraySource), () => "second");

		expect(arrayStepper.stepNames.value).toEqual(["first", "second", "last"]);
		expect(arrayStepper.current.value).toBe("second");

		first.value = "start";

		expect(arrayStepper.stepNames.value).toEqual(["start", "second", "last"]);
		expect(arrayStepper.current.value).toBe("second");

		const title = signal("First");
		const objectSource = signal({
			first: title,
			second: computed(() => "Second"),
		});
		const objectStepper = useStepper(() => objectSource.value, "first");

		expect(objectStepper.current.value).toBe("First");

		title.value = "Start";

		expect(objectStepper.current.value).toBe("Start");
	});

	it("keeps the current step when the list changes and resets when it disappears", () => {
		const source = signal<readonly string[]>(["first", "second", "last"]);
		const stepper = useStepper(source);

		stepper.goTo("second");
		source.value = ["second", "last"] as const;

		expect(stepper.current.value).toBe("second");
		expect(stepper.index.value).toBe(0);

		source.value = ["last"] as const;

		expect(stepper.current.value).toBe("last");
		expect(stepper.index.value).toBe(0);
	});

	it("handles empty steps", () => {
		const source = signal<string[]>([]);
		const stepper = useStepper(source);

		expect(stepper.steps.value).toEqual([]);
		expect(stepper.stepNames.value).toEqual([]);
		expect(stepper.index.value).toBe(0);
		expect(stepper.current.value).toBeUndefined();
		expect(stepper.next.value).toBeUndefined();
		expect(stepper.previous.value).toBeUndefined();
		expect(stepper.isFirst.value).toBe(false);
		expect(stepper.isLast.value).toBe(false);

		stepper.index.value = 1;
		stepper.goToNext();
		stepper.goToPrevious();
		stepper.goTo("missing");

		expect(stepper.index.value).toBe(0);
		expect(stepper.current.value).toBeUndefined();

		source.value = ["first"];

		expect(stepper.index.value).toBe(0);
		expect(stepper.current.value).toBe("first");
		expect(stepper.isFirst.value).toBe(true);
		expect(stepper.isLast.value).toBe(true);
	});
});
