import { computed, readonly } from "@sigrea/core";

import { resolveValue } from "../../shared/resolveValue";
import type {
	MaybeValue,
	UseTimeAgoIntlFormatOptions,
	UseTimeAgoIntlOptions,
	UseTimeAgoIntlReturn,
	UseTimeAgoIntlUnit,
} from "../types";
import { useIntervalFn } from "../useIntervalFn";
import { useNow } from "../useNow";

const DEFAULT_TIME_AGO_INTL_UNITS: UseTimeAgoIntlUnit[] = [
	{ name: "year", ms: 31_536_000_000 },
	{ name: "month", ms: 2_592_000_000 },
	{ name: "week", ms: 604_800_000 },
	{ name: "day", ms: 86_400_000 },
	{ name: "hour", ms: 3_600_000 },
	{ name: "minute", ms: 60_000 },
	{ name: "second", ms: 1000 },
];

interface TimeAgoIntlResult {
	parts: Intl.RelativeTimeFormatPart[];
	resolvedLocale: Intl.LocalesArgument;
}

function getDefaultScheduler(
	options: UseTimeAgoIntlOptions<boolean>,
): UseTimeAgoIntlOptions<boolean>["scheduler"] {
	if ("updateInterval" in options) {
		const { updateInterval = 30_000 } = options;
		return (callback) => useIntervalFn(callback, updateInterval);
	}

	return (callback) => useIntervalFn(callback, 30_000);
}

function getTimeAgoIntlResult(
	from: Date,
	options: UseTimeAgoIntlFormatOptions = {},
	now: Date | number = Date.now(),
): TimeAgoIntlResult {
	const { relativeTimeFormatOptions = { numeric: "auto" } } = options;
	const rtf = new Intl.RelativeTimeFormat(
		resolveValue(options.locale),
		relativeTimeFormatOptions,
	);
	const { locale: resolvedLocale } = rtf.resolvedOptions();
	const diff = +from - +now;
	const absDiff = Math.abs(diff);
	const units = options.units ?? DEFAULT_TIME_AGO_INTL_UNITS;

	for (const { name, ms } of units) {
		if (absDiff >= ms) {
			return {
				parts: rtf.formatToParts(Math.round(diff / ms), name),
				resolvedLocale,
			};
		}
	}

	return {
		parts: rtf.formatToParts(0, units[units.length - 1].name),
		resolvedLocale,
	};
}

export function formatTimeAgoIntlParts(
	parts: Intl.RelativeTimeFormatPart[],
	options: UseTimeAgoIntlFormatOptions = {},
): string {
	const { insertSpace = true, joinParts } = options;
	const locale = resolveValue(options.locale);

	if (typeof joinParts === "function") {
		return joinParts(parts, locale);
	}

	if (!insertSpace) {
		return parts.map((part) => part.value).join("");
	}

	return parts.map((part) => part.value.trim()).join(" ");
}

export function formatTimeAgoIntl(
	from: Date,
	options: UseTimeAgoIntlFormatOptions = {},
	now: Date | number = Date.now(),
): string {
	const { parts, resolvedLocale } = getTimeAgoIntlResult(from, options, now);

	return formatTimeAgoIntlParts(parts, {
		...options,
		locale: resolvedLocale,
	});
}

export function useTimeAgoIntl(
	time: MaybeValue<Date | number | string>,
	options?: UseTimeAgoIntlOptions<false>,
): UseTimeAgoIntlReturn<false>;
export function useTimeAgoIntl(
	time: MaybeValue<Date | number | string>,
	options: UseTimeAgoIntlOptions<true>,
): UseTimeAgoIntlReturn<true>;
export function useTimeAgoIntl(
	time: MaybeValue<Date | number | string>,
	options: UseTimeAgoIntlOptions<boolean> = {},
): UseTimeAgoIntlReturn<boolean> {
	const { controls: exposeControls = false } = options;
	const scheduler = options.scheduler ?? getDefaultScheduler(options);
	const { now, ...controls } = useNow({
		controls: true,
		scheduler,
	});
	const result = computed(() =>
		getTimeAgoIntlResult(new Date(resolveValue(time)), options, now.value),
	);
	const parts = readonly(computed(() => result.value.parts));
	const timeAgoIntl = readonly(
		computed(() =>
			formatTimeAgoIntlParts(parts.value, {
				...options,
				locale: result.value.resolvedLocale,
			}),
		),
	);

	if (exposeControls) {
		return {
			timeAgoIntl,
			parts,
			...controls,
		} as UseTimeAgoIntlReturn<boolean>;
	}

	return timeAgoIntl as UseTimeAgoIntlReturn<boolean>;
}
