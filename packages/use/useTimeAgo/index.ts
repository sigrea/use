import { computed, readonly } from "@sigrea/core";

import { resolveValue } from "../../shared/resolveValue";
import type {
	MaybeValue,
	UseTimeAgoFormatOptions,
	UseTimeAgoFormatter,
	UseTimeAgoMessages,
	UseTimeAgoMessagesBuiltIn,
	UseTimeAgoOptions,
	UseTimeAgoReturn,
	UseTimeAgoUnit,
	UseTimeAgoUnitNamesDefault,
} from "../types";
import { useIntervalFn } from "../useIntervalFn";
import { useNow } from "../useNow";

const DEFAULT_TIME_AGO_UNITS: UseTimeAgoUnit<UseTimeAgoUnitNamesDefault>[] = [
	{ max: 60_000, name: "second", value: 1000 },
	{ max: 2_760_000, name: "minute", value: 60_000 },
	{ max: 72_000_000, name: "hour", value: 3_600_000 },
	{ max: 518_400_000, name: "day", value: 86_400_000 },
	{ max: 2_419_200_000, name: "week", value: 604_800_000 },
	{ max: 28_512_000_000, name: "month", value: 2_592_000_000 },
	{ max: Number.POSITIVE_INFINITY, name: "year", value: 31_536_000_000 },
];

const DEFAULT_TIME_AGO_MESSAGES: UseTimeAgoMessages<UseTimeAgoUnitNamesDefault> =
	{
		justNow: "just now",
		past: (value) => (/\d/.test(value) ? `${value} ago` : value),
		future: (value) => (/\d/.test(value) ? `in ${value}` : value),
		month: (value, isPast) =>
			value === 1
				? isPast
					? "last month"
					: "next month"
				: `${value} month${value > 1 ? "s" : ""}`,
		year: (value, isPast) =>
			value === 1
				? isPast
					? "last year"
					: "next year"
				: `${value} year${value > 1 ? "s" : ""}`,
		day: (value, isPast) =>
			value === 1
				? isPast
					? "yesterday"
					: "tomorrow"
				: `${value} day${value > 1 ? "s" : ""}`,
		week: (value, isPast) =>
			value === 1
				? isPast
					? "last week"
					: "next week"
				: `${value} week${value > 1 ? "s" : ""}`,
		hour: (value) => `${value} hour${value > 1 ? "s" : ""}`,
		minute: (value) => `${value} minute${value > 1 ? "s" : ""}`,
		second: (value) => `${value} second${value > 1 ? "s" : ""}`,
		invalid: "",
	};

function defaultFullDateFormatter(date: Date): string {
	return date.toISOString().slice(0, 10);
}

function resolveRoundFn(
	rounding: UseTimeAgoFormatOptions["rounding"],
): (value: number) => number {
	if (typeof rounding === "number") {
		return (value) => +value.toFixed(rounding);
	}

	return Math[rounding ?? "round"];
}

function applyFormat<UnitNames extends string>(
	messages: UseTimeAgoMessages<UnitNames>,
	name: UnitNames | keyof UseTimeAgoMessagesBuiltIn,
	value: number | string,
	isPast: boolean,
): string {
	const formatter = (
		messages as Record<string, string | UseTimeAgoFormatter<number | string>>
	)[name];
	if (typeof formatter === "function") {
		return formatter(value, isPast);
	}

	return formatter.replace("{0}", value.toString());
}

export function formatTimeAgo<
	UnitNames extends string = UseTimeAgoUnitNamesDefault,
>(
	from: Date,
	options: UseTimeAgoFormatOptions<UnitNames> = {},
	now: Date | number = Date.now(),
): string {
	const {
		max,
		messages = DEFAULT_TIME_AGO_MESSAGES as UseTimeAgoMessages<UnitNames>,
		fullDateFormatter = defaultFullDateFormatter,
		units = DEFAULT_TIME_AGO_UNITS as UseTimeAgoUnit<UnitNames>[],
		showSecond = false,
		rounding = "round",
	} = options;
	const round = resolveRoundFn(rounding);
	const diff = +now - +from;
	const absDiff = Math.abs(diff);
	const getValue = (value: number, unit: UseTimeAgoUnit<UnitNames>) =>
		round(Math.abs(value) / unit.value);
	const format = (value: number, unit: UseTimeAgoUnit<UnitNames>) => {
		const unitValue = getValue(value, unit);
		const isPast = value > 0;
		const unitText = applyFormat(messages, unit.name, unitValue, isPast);

		return applyFormat(messages, isPast ? "past" : "future", unitText, isPast);
	};

	if (absDiff < 60_000 && !showSecond) {
		return messages.justNow;
	}

	if (typeof max === "number" && absDiff > max) {
		return fullDateFormatter(new Date(from));
	}

	if (typeof max === "string") {
		const unitMax = units.find((unit) => unit.name === max)?.max;
		if (unitMax !== undefined && absDiff > unitMax) {
			return fullDateFormatter(new Date(from));
		}
	}

	for (const [index, unit] of units.entries()) {
		const value = getValue(diff, unit);
		const previousUnit = units[index - 1];

		if (value <= 0 && previousUnit !== undefined) {
			return format(diff, previousUnit);
		}
		if (absDiff < unit.max) {
			return format(diff, unit);
		}
	}

	return messages.invalid;
}

function getDefaultScheduler(
	options: UseTimeAgoOptions<boolean, string>,
): UseTimeAgoOptions<boolean, string>["scheduler"] {
	if ("updateInterval" in options) {
		const { updateInterval = 30_000 } = options;
		return (callback) => useIntervalFn(callback, updateInterval);
	}

	return (callback) => useIntervalFn(callback, 30_000);
}

export function useTimeAgo<
	UnitNames extends string = UseTimeAgoUnitNamesDefault,
>(
	time: MaybeValue<Date | number | string>,
	options?: UseTimeAgoOptions<false, UnitNames>,
): UseTimeAgoReturn<false>;
export function useTimeAgo<
	UnitNames extends string = UseTimeAgoUnitNamesDefault,
>(
	time: MaybeValue<Date | number | string>,
	options: UseTimeAgoOptions<true, UnitNames>,
): UseTimeAgoReturn<true>;
export function useTimeAgo<
	UnitNames extends string = UseTimeAgoUnitNamesDefault,
>(
	time: MaybeValue<Date | number | string>,
	options: UseTimeAgoOptions<boolean, UnitNames> = {},
): UseTimeAgoReturn<boolean> {
	const { controls: exposeControls = false } = options;
	const scheduler =
		options.scheduler ??
		(getDefaultScheduler(
			options as UseTimeAgoOptions<boolean, string>,
		) as UseTimeAgoOptions<boolean, UnitNames>["scheduler"]);
	const { now, ...controls } = useNow({
		controls: true,
		scheduler,
	});
	const timeAgo = readonly(
		computed(() =>
			formatTimeAgo(new Date(resolveValue(time)), options, now.value),
		),
	);

	if (exposeControls) {
		return {
			timeAgo,
			...controls,
		} as UseTimeAgoReturn<boolean>;
	}

	return timeAgo as UseTimeAgoReturn<boolean>;
}
