// @vitest-environment node

import type { ReadonlySignal } from "@sigrea/core";
import {
	createScope,
	disposeScope,
	disposeTrackedMolecules,
	readonly,
	runWithScope,
	signal,
} from "@sigrea/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useIntervalFn } from "../useIntervalFn";
import {
	formatTimeAgoIntl,
	formatTimeAgoIntlParts,
	useTimeAgoIntl,
} from "./index";

describe("formatTimeAgoIntlParts", () => {
	it("formats with spaces by default", () => {
		const englishParts: Intl.RelativeTimeFormatPart[] = [
			{ type: "integer", value: "5", unit: "day" },
			{ type: "literal", value: " days" },
		];
		const chineseParts: Intl.RelativeTimeFormatPart[] = [
			{ type: "integer", value: "5", unit: "day" },
			{ type: "literal", value: "天后" },
		];

		expect(formatTimeAgoIntlParts(englishParts)).toBe("5 days");
		expect(formatTimeAgoIntlParts(chineseParts)).toBe("5 天后");
	});

	it("can join parts without inserting spaces", () => {
		const englishParts: Intl.RelativeTimeFormatPart[] = [
			{ type: "integer", value: "5", unit: "day" },
			{ type: "literal", value: " days" },
		];
		const chineseParts: Intl.RelativeTimeFormatPart[] = [
			{ type: "integer", value: "5", unit: "day" },
			{ type: "literal", value: "天后" },
		];

		expect(formatTimeAgoIntlParts(englishParts, { insertSpace: false })).toBe(
			"5 days",
		);
		expect(formatTimeAgoIntlParts(chineseParts, { insertSpace: false })).toBe(
			"5天后",
		);
	});

	it("uses a custom joinParts callback", () => {
		const parts: Intl.RelativeTimeFormatPart[] = [
			{ type: "integer", value: "5", unit: "day" },
			{ type: "literal", value: " days" },
		];

		expect(
			formatTimeAgoIntlParts(parts, {
				joinParts: (nextParts, locale) =>
					`${locale}:${nextParts.map((part) => `[${part.value}]`).join("|")}`,
				locale: "en-US",
			}),
		).toBe("en-US:[5]|[ days]");
	});
});

describe("formatTimeAgoIntl", () => {
	it("formats past and future timestamps with Intl.RelativeTimeFormat", () => {
		const now = new Date("2026-05-07T00:00:00.000Z");
		const past = new Date(+now - 5 * 60_000);
		const future = new Date(+now + 5 * 60_000);

		expect(formatTimeAgoIntl(past, { locale: "en" }, now)).toBe(
			"5 minutes ago",
		);
		expect(formatTimeAgoIntl(future, { locale: "en" }, now)).toBe(
			"in 5 minutes",
		);
	});

	it("uses custom units when choosing the Intl unit", () => {
		const now = new Date("2026-05-07T00:00:00.000Z");
		const future = new Date(+now + 7_776_000_000);

		expect(
			formatTimeAgoIntl(
				future,
				{
					locale: "en",
					relativeTimeFormatOptions: { numeric: "always" },
					units: [
						{ name: "quarter", ms: 7_776_000_000 },
						{ name: "day", ms: 86_400_000 },
						{ name: "second", ms: 1000 },
					],
				},
				now,
			),
		).toBe("in 1 quarter");
	});

	it("passes the resolved locale to joinParts", () => {
		const now = new Date("2026-05-07T00:00:00.000Z");
		const future = new Date(+now + 60_000);

		expect(
			formatTimeAgoIntl(
				future,
				{
					joinParts: (_parts, locale) => String(locale),
					locale: "en-US",
				},
				now,
			),
		).toBe("en-US");
	});
});

describe("useTimeAgoIntl", () => {
	const baseTime = new Date("2026-05-07T00:00:00.000Z").getTime();

	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(baseTime);
	});

	afterEach(() => {
		disposeTrackedMolecules();
		vi.useRealTimers();
	});

	it("computes a reactive Intl time ago string", () => {
		const source = signal(baseTime - 5 * 60_000);
		const timeAgoIntl = useTimeAgoIntl(source, {
			locale: "en",
			updateInterval: 0,
		});

		expect(timeAgoIntl.value).toBe("5 minutes ago");

		source.value = baseTime + 5 * 60_000;

		expect(timeAgoIntl.value).toBe("in 5 minutes");
	});

	it("uses native Date parsing for string inputs", () => {
		const timeAgoIntl = useTimeAgoIntl("2026-05-07", {
			locale: "en",
			updateInterval: 0,
		});

		expect(timeAgoIntl.value).toBe("now");
	});

	it("exposes controls and raw Intl parts", () => {
		const { isActive, parts, timeAgoIntl } = useTimeAgoIntl(baseTime, {
			controls: true,
			locale: "en",
			relativeTimeFormatOptions: { numeric: "always" },
			updateInterval: 500,
		});

		expect(isActive.value).toBe(true);
		expect(timeAgoIntl.value).toBe("in 0 seconds");
		expect(parts.value).toEqual([
			{ type: "literal", value: "in " },
			{ type: "integer", value: "0", unit: "second" },
			{ type: "literal", value: " seconds" },
		]);

		vi.advanceTimersByTime(1000);

		expect(timeAgoIntl.value).toBe("1 second ago");
	});

	it("prioritizes scheduler over updateInterval", () => {
		const isActive = signal(true);
		let tick = () => {};
		const scheduler = vi.fn((callback: () => void) => {
			tick = callback;

			return {
				isActive: readonly(isActive) as ReadonlySignal<boolean>,
				pause: () => {
					isActive.value = false;
				},
				resume: () => {
					isActive.value = true;
				},
			};
		});
		const { timeAgoIntl } = useTimeAgoIntl(baseTime, {
			controls: true,
			locale: "en",
			relativeTimeFormatOptions: { numeric: "always" },
			scheduler,
			updateInterval: 10,
		});

		expect(scheduler).toHaveBeenCalledTimes(1);
		expect(timeAgoIntl.value).toBe("in 0 seconds");

		vi.advanceTimersByTime(1000);

		expect(timeAgoIntl.value).toBe("in 0 seconds");

		tick();

		expect(timeAgoIntl.value).toBe("1 second ago");
	});

	it("accepts a reactive updateInterval", () => {
		const interval = signal(1000);
		const { timeAgoIntl } = useTimeAgoIntl(baseTime, {
			controls: true,
			locale: "en",
			relativeTimeFormatOptions: { numeric: "always" },
			updateInterval: interval,
		});

		vi.advanceTimersByTime(900);

		expect(timeAgoIntl.value).toBe("in 0 seconds");

		interval.value = 100;
		vi.advanceTimersByTime(100);

		expect(timeAgoIntl.value).toBe("1 second ago");
	});

	it("can disable automatic updates with updateInterval zero", () => {
		const { isActive, resume, timeAgoIntl } = useTimeAgoIntl(baseTime, {
			controls: true,
			locale: "en",
			relativeTimeFormatOptions: { numeric: "always" },
			updateInterval: 0,
		});

		vi.advanceTimersByTime(1000);

		expect(isActive.value).toBe(false);
		expect(timeAgoIntl.value).toBe("in 0 seconds");

		resume();

		expect(isActive.value).toBe(false);
	});

	it("accepts a custom scheduler implementation", () => {
		const { timeAgoIntl } = useTimeAgoIntl(baseTime, {
			controls: true,
			locale: "en",
			relativeTimeFormatOptions: { numeric: "always" },
			scheduler: (callback) => useIntervalFn(callback, 1000),
		});

		vi.advanceTimersByTime(1000);

		expect(timeAgoIntl.value).toBe("1 second ago");
	});

	it("cleans up active updates with scope disposal", () => {
		const scope = createScope();
		let timeAgoIntl!: ReadonlySignal<string>;
		let isActive!: ReadonlySignal<boolean>;

		runWithScope(scope, () => {
			const controls = useTimeAgoIntl(baseTime, {
				controls: true,
				locale: "en",
				relativeTimeFormatOptions: { numeric: "always" },
				updateInterval: 10,
			});
			timeAgoIntl = controls.timeAgoIntl;
			isActive = controls.isActive;
		});

		vi.advanceTimersByTime(10);

		expect(timeAgoIntl.value).toBe("in 0 seconds");

		disposeScope(scope);
		vi.advanceTimersByTime(100);

		expect(isActive.value).toBe(false);
		expect(timeAgoIntl.value).toBe("in 0 seconds");
	});
});
