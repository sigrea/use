import type { ReadonlySignal } from "@sigrea/core";
import {
	computed,
	createScope,
	disposeScope,
	disposeTrackedMolecules,
	runWithScope,
	signal,
} from "@sigrea/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { formatTimeAgo, useTimeAgo } from "./index";

type TimeUnit =
	| "second"
	| "minute"
	| "hour"
	| "day"
	| "week"
	| "month"
	| "year";

const units = [
	{ max: 60_000, value: 1000, name: "second" },
	{ max: 2_760_000, value: 60_000, name: "minute" },
	{ max: 72_000_000, value: 3_600_000, name: "hour" },
	{ max: 518_400_000, value: 86_400_000, name: "day" },
	{ max: 2_419_200_000, value: 604_800_000, name: "week" },
	{ max: 28_512_000_000, value: 2_592_000_000, name: "month" },
	{ max: Number.POSITIVE_INFINITY, value: 31_536_000_000, name: "year" },
] as const;

function getNeededTimeChange(
	type: TimeUnit,
	count: number,
	adjustSecond = 0,
): number {
	const unit = units.find((unit) => unit.name === type);

	return (unit?.value ?? 0) * count + adjustSecond * 1000;
}

function fullDateFormatter(value: Date | number): string {
	return new Date(value).toISOString().slice(0, 10);
}

describe("useTimeAgo", () => {
	let baseTime = 0;
	const changeValue = signal(0);
	const changeTime = computed(() => baseTime + changeValue.value);

	beforeEach(() => {
		vi.useFakeTimers();
		baseTime = new Date("2026-05-07T00:00:00.000Z").getTime();
		vi.setSystemTime(baseTime);
		changeValue.value = 0;
	});

	afterEach(() => {
		disposeTrackedMolecules();
		vi.useRealTimers();
	});

	it("returns just now for differences under one minute by default", () => {
		expect(useTimeAgo(baseTime).value).toBe("just now");

		changeValue.value = getNeededTimeChange("minute", 1, -1);

		expect(useTimeAgo(changeTime).value).toBe("just now");
	});

	it("formats seconds when showSecond is true", () => {
		changeValue.value = getNeededTimeChange("minute", 1, -1);

		expect(useTimeAgo(changeTime, { showSecond: true }).value).toBe(
			"in 59 seconds",
		);

		changeValue.value = -getNeededTimeChange("minute", 1, -1);

		expect(useTimeAgo(changeTime, { showSecond: true }).value).toBe(
			"59 seconds ago",
		);
	});

	it("formats minute hour day week month and year values", () => {
		const cases: Array<[TimeUnit, number, string, string]> = [
			["minute", 1, "in 1 minute", "1 minute ago"],
			["minute", 10, "in 10 minutes", "10 minutes ago"],
			["hour", 1, "in 1 hour", "1 hour ago"],
			["hour", 10, "in 10 hours", "10 hours ago"],
			["day", 1, "tomorrow", "yesterday"],
			["day", 3, "in 3 days", "3 days ago"],
			["week", 1, "next week", "last week"],
			["week", 3, "in 3 weeks", "3 weeks ago"],
			["month", 1, "next month", "last month"],
			["month", 3, "in 3 months", "3 months ago"],
			["year", 1, "next year", "last year"],
			["year", 3, "in 3 years", "3 years ago"],
		];

		for (const [unit, count, future, past] of cases) {
			changeValue.value = getNeededTimeChange(unit, count);
			expect(useTimeAgo(changeTime).value).toBe(future);

			changeValue.value = -getNeededTimeChange(unit, count);
			expect(useTimeAgo(changeTime).value).toBe(past);
		}
	});

	it("supports max full date formatting", () => {
		changeValue.value = getNeededTimeChange("minute", 1, 1);

		expect(
			useTimeAgo(changeTime, {
				fullDateFormatter,
				max: "second",
				showSecond: true,
			}).value,
		).toBe(fullDateFormatter(changeTime.value));

		changeValue.value = getNeededTimeChange("minute", 1, -49);

		expect(
			useTimeAgo(changeTime, {
				fullDateFormatter,
				max: 10_000,
				showSecond: true,
			}).value,
		).toBe(fullDateFormatter(changeTime.value));
	});

	it("supports rounding options and unit fallback", () => {
		changeValue.value = getNeededTimeChange("day", 5.49);

		expect(useTimeAgo(changeTime).value).toBe("in 5 days");
		expect(useTimeAgo(changeTime, { rounding: "ceil" }).value).toBe(
			"in 6 days",
		);
		expect(useTimeAgo(changeTime, { rounding: "floor" }).value).toBe(
			"in 5 days",
		);
		expect(useTimeAgo(changeTime, { rounding: 1 }).value).toBe("in 5.5 days");

		changeValue.value = getNeededTimeChange("month", 11.5);

		expect(useTimeAgo(changeTime, { rounding: "floor" }).value).toBe(
			"in 11 months",
		);
		expect(useTimeAgo(changeTime, { rounding: 1 }).value).toBe("in 0.9 year");
	});

	it("supports custom messages and custom units", () => {
		changeValue.value = getNeededTimeChange("day", 14);

		expect(
			useTimeAgo(changeTime, {
				units: [
					{ max: 60_000, value: 1000, name: "second" },
					{ max: 2_760_000, value: 60_000, name: "minute" },
					{ max: 72_000_000, value: 3_600_000, name: "hour" },
					{ max: 518_400_000 * 30, value: 86_400_000, name: "day" },
					{ max: 28_512_000_000, value: 2_592_000_000, name: "month" },
					{
						max: Number.POSITIVE_INFINITY,
						value: 31_536_000_000,
						name: "year",
					},
				],
			}).value,
		).toBe("in 14 days");

		expect(
			useTimeAgo(baseTime, {
				messages: {
					...defaultMessagesForTest(),
					second: "{0}",
					future: "{0}",
				},
				showSecond: true,
			}).value,
		).toBe("0");
	});

	it("returns invalid message for custom units without a formatter", () => {
		changeValue.value = getNeededTimeChange("day", 90);

		expect(
			useTimeAgo<"second" | "quarter">(changeTime, {
				units: [
					{ max: 60_000, value: 1000, name: "second" },
					{
						max: Number.POSITIVE_INFINITY,
						value: 7_776_000_000,
						name: "quarter",
					},
				],
			}).value,
		).toBe("");
	});

	it("returns invalid message when the date is invalid", () => {
		expect(useTimeAgo("invalid date").value).toBe("");
	});

	it("uses native Date parsing for string inputs", () => {
		expect(useTimeAgo("2026-05-07", { updateInterval: 0 }).value).toBe(
			"just now",
		);
	});

	it("updates from reactive time sources", () => {
		const source = signal(baseTime);
		const timeAgo = useTimeAgo(source, { showSecond: true });

		source.value = baseTime - 2000;

		expect(timeAgo.value).toBe("2 seconds ago");
	});

	it("exposes pause and resume controls", () => {
		const { isActive, pause, resume, timeAgo } = useTimeAgo(baseTime, {
			controls: true,
			showSecond: true,
			updateInterval: 500,
		});

		vi.advanceTimersByTime(400);
		expect(isActive.value).toBe(true);
		expect(timeAgo.value).toContain("0 second");

		pause();
		vi.advanceTimersByTime(700);
		expect(isActive.value).toBe(false);
		expect(timeAgo.value).toContain("0 second");

		resume();
		vi.advanceTimersByTime(1000);
		expect(isActive.value).toBe(true);
		expect(timeAgo.value).toBe("2 seconds ago");
	});

	it("can disable automatic updates with updateInterval zero", () => {
		const { isActive, resume, timeAgo } = useTimeAgo(baseTime, {
			controls: true,
			showSecond: true,
			updateInterval: 0,
		});

		vi.advanceTimersByTime(2000);

		expect(isActive.value).toBe(false);
		expect(timeAgo.value).toContain("0 second");

		resume();
		expect(isActive.value).toBe(false);
	});

	it("cleans up active updates with scope disposal", () => {
		const scope = createScope();
		let timeAgo!: ReadonlySignal<string>;
		let isActive!: ReadonlySignal<boolean>;

		runWithScope(scope, () => {
			const controls = useTimeAgo(baseTime, {
				controls: true,
				showSecond: true,
				updateInterval: 10,
			});
			timeAgo = controls.timeAgo;
			isActive = controls.isActive;
		});

		vi.advanceTimersByTime(10);

		expect(timeAgo.value).toBe("0 second ago");

		disposeScope(scope);
		vi.advanceTimersByTime(100);

		expect(isActive.value).toBe(false);
		expect(timeAgo.value).toBe("0 second ago");
	});
});

describe("formatTimeAgo", () => {
	it("formats without creating reactive state", () => {
		const now = new Date("2026-05-07T00:01:00.000Z");
		const from = new Date("2026-05-07T00:00:00.000Z");

		expect(formatTimeAgo(from, {}, now)).toBe("1 minute ago");
	});
});

function defaultMessagesForTest() {
	return {
		justNow: "just now",
		past: (value: string) => (/\d/.test(value) ? `${value} ago` : value),
		future: (value: string) => (/\d/.test(value) ? `in ${value}` : value),
		month: (value: number, isPast: boolean) =>
			value === 1
				? isPast
					? "last month"
					: "next month"
				: `${value} month${value > 1 ? "s" : ""}`,
		year: (value: number, isPast: boolean) =>
			value === 1
				? isPast
					? "last year"
					: "next year"
				: `${value} year${value > 1 ? "s" : ""}`,
		day: (value: number, isPast: boolean) =>
			value === 1
				? isPast
					? "yesterday"
					: "tomorrow"
				: `${value} day${value > 1 ? "s" : ""}`,
		week: (value: number, isPast: boolean) =>
			value === 1
				? isPast
					? "last week"
					: "next week"
				: `${value} week${value > 1 ? "s" : ""}`,
		hour: (value: number) => `${value} hour${value > 1 ? "s" : ""}`,
		minute: (value: number) => `${value} minute${value > 1 ? "s" : ""}`,
		second: (value: number) => `${value} second${value > 1 ? "s" : ""}`,
		invalid: "",
	};
}
