import { computed, readonly } from "@sigrea/core";

import { resolveValue } from "../../shared/resolveValue";
import type {
	DateLike,
	MaybeValue,
	UseDateFormatOptions,
	UseDateFormatReturn,
} from "../types";

const REGEX_PARSE =
	/^(\d{4})[-/]?(\d{1,2})?[-/]?(\d{0,2})[T\s]*(\d{1,2})?:?(\d{1,2})?:?(\d{1,2})?[.:]?(\d+)?$/i;
const REGEX_FORMAT =
	/[YMDHhms]o|\[([^\]]+)\]|Y{1,4}|M{1,4}|D{1,2}|d{1,4}|H{1,2}|h{1,2}|a{1,2}|A{1,2}|m{1,2}|s{1,2}|Z{1,2}|z{1,4}|SSS/g;

function defaultMeridiem(
	hours: number,
	_minutes: number,
	isLowercase?: boolean,
	hasPeriod?: boolean,
) {
	let meridiem = hours < 12 ? "AM" : "PM";
	if (hasPeriod) {
		meridiem = meridiem
			.split("")
			.reduce((value, character) => `${value}${character}.`, "");
	}

	return isLowercase ? meridiem.toLowerCase() : meridiem;
}

function formatOrdinal(num: number) {
	const suffixes = ["th", "st", "nd", "rd"];
	const value = num % 100;

	return num + (suffixes[(value - 20) % 10] || suffixes[value] || suffixes[0]);
}

function resolveLocales(options: UseDateFormatOptions) {
	return resolveValue(options.locales);
}

function formatTimeZoneName(
	date: Date,
	options: UseDateFormatOptions,
	timeZoneName: "shortOffset" | "longOffset",
) {
	return (
		date
			.toLocaleDateString(resolveLocales(options), { timeZoneName })
			.split(" ")[1] ?? ""
	);
}

export function formatDate(
	date: Date,
	formatStr: string,
	options: UseDateFormatOptions = {},
) {
	const years = date.getFullYear();
	const month = date.getMonth();
	const days = date.getDate();
	const hours = date.getHours();
	const minutes = date.getMinutes();
	const seconds = date.getSeconds();
	const milliseconds = date.getMilliseconds();
	const day = date.getDay();
	const meridiem = options.customMeridiem ?? defaultMeridiem;
	const matches: Record<string, () => string | number> = {
		Yo: () => formatOrdinal(years),
		YY: () => String(years).slice(-2),
		YYYY: () => years,
		M: () => month + 1,
		Mo: () => formatOrdinal(month + 1),
		MM: () => `${month + 1}`.padStart(2, "0"),
		MMM: () =>
			date.toLocaleDateString(resolveLocales(options), { month: "short" }),
		MMMM: () =>
			date.toLocaleDateString(resolveLocales(options), { month: "long" }),
		D: () => String(days),
		Do: () => formatOrdinal(days),
		DD: () => `${days}`.padStart(2, "0"),
		H: () => String(hours),
		Ho: () => formatOrdinal(hours),
		HH: () => `${hours}`.padStart(2, "0"),
		h: () => `${hours % 12 || 12}`.padStart(1, "0"),
		ho: () => formatOrdinal(hours % 12 || 12),
		hh: () => `${hours % 12 || 12}`.padStart(2, "0"),
		m: () => String(minutes),
		mo: () => formatOrdinal(minutes),
		mm: () => `${minutes}`.padStart(2, "0"),
		s: () => String(seconds),
		so: () => formatOrdinal(seconds),
		ss: () => `${seconds}`.padStart(2, "0"),
		SSS: () => `${milliseconds}`.padStart(3, "0"),
		d: () => day,
		dd: () =>
			date.toLocaleDateString(resolveLocales(options), { weekday: "narrow" }),
		ddd: () =>
			date.toLocaleDateString(resolveLocales(options), { weekday: "short" }),
		dddd: () =>
			date.toLocaleDateString(resolveLocales(options), { weekday: "long" }),
		A: () => meridiem(hours, minutes),
		AA: () => meridiem(hours, minutes, false, true),
		a: () => meridiem(hours, minutes, true),
		aa: () => meridiem(hours, minutes, true, true),
		z: () => formatTimeZoneName(date, options, "shortOffset"),
		zz: () => formatTimeZoneName(date, options, "shortOffset"),
		zzz: () => formatTimeZoneName(date, options, "shortOffset"),
		zzzz: () => formatTimeZoneName(date, options, "longOffset"),
	};

	return formatStr.replace(REGEX_FORMAT, (match, escaped: string | undefined) =>
		String(escaped ?? matches[match]?.() ?? match),
	);
}

export function normalizeDate(date: DateLike) {
	if (date === null) {
		return new Date(Number.NaN);
	}
	if (date === undefined) {
		return new Date();
	}
	if (date instanceof Date) {
		return new Date(date);
	}
	if (typeof date === "string" && !/Z$/i.test(date)) {
		const match = date.match(REGEX_PARSE);
		if (match) {
			const [, year, month, day, hours, minutes, seconds, milliseconds] = match;
			const monthIndex = month ? Number(month) - 1 : 0;
			const dateValue = day ? Number(day) : 1;
			const millisecondValue = Number((milliseconds || "0").substring(0, 3));

			return new Date(
				Number(year),
				monthIndex,
				dateValue,
				hours ? Number(hours) : 0,
				minutes ? Number(minutes) : 0,
				seconds ? Number(seconds) : 0,
				millisecondValue,
			);
		}
	}

	return new Date(date);
}

export function useDateFormat(
	date: MaybeValue<DateLike>,
	formatStr: MaybeValue<string> = "HH:mm:ss",
	options: UseDateFormatOptions = {},
): UseDateFormatReturn {
	return readonly(
		computed(() =>
			formatDate(
				normalizeDate(resolveValue(date)),
				resolveValue(formatStr),
				options,
			),
		),
	);
}
