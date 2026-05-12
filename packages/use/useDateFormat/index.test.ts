// @vitest-environment node

import { computed, signal } from "@sigrea/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import { formatDate, normalizeDate, useDateFormat } from "./index";

describe("useDateFormat", () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it("exports date formatting helpers", () => {
		expect(normalizeDate).toBeDefined();
		expect(formatDate).toBeDefined();
		expect(useDateFormat).toBeDefined();
	});

	it("normalizes supported date inputs", () => {
		const now = new Date(2026, 4, 5, 12, 30, 0);
		vi.useFakeTimers();
		vi.setSystemTime(now);

		expect(normalizeDate(undefined)).toEqual(now);
		// @ts-expect-error null is intentionally treated as an invalid runtime input
		expect(normalizeDate(null).toString()).toBe("Invalid Date");
		expect(normalizeDate(new Date(2022, 0, 1))).toEqual(new Date(2022, 0, 1));
		expect(normalizeDate("2022-01")).toEqual(new Date(2022, 0, 1));
		expect(normalizeDate("2022-01-01")).toEqual(new Date(2022, 0, 1));
		expect(normalizeDate("2022-01-01T00:00:00.009")).toEqual(
			new Date(2022, 0, 1, 0, 0, 0, 9),
		);
		expect(normalizeDate("2022-01-01T00:00:00.9999")).toEqual(
			new Date(2022, 0, 1, 0, 0, 0, 999),
		);
	});

	it("formats date and time tokens", () => {
		const date = new Date(2022, 0, 1, 15, 5, 6, 9);

		expect(formatDate(date, "YYYY-MM-DD HH:mm:ss:SSS")).toBe(
			"2022-01-01 15:05:06:009",
		);
		expect(formatDate(date, "YY-M-D H:m:s")).toBe("22-1-1 15:5:6");
		expect(formatDate(new Date(2022, 0, 1, 0, 5, 0), "h:m:s")).toBe("12:5:0");
		expect(formatDate(date, "hh:mm:ss d")).toBe("03:05:06 6");
		expect(
			formatDate(date, "MMMM Do Yo [at] hh:mm A", {
				locales: "en-US",
			}),
		).toBe("January 1st 2022nd at 03:05 PM");
	});

	it("formats the supported token set", () => {
		const date = new Date(2024, 0, 2, 15, 4, 5, 6);

		expect(
			formatDate(
				date,
				"Yo YY YYYY | M Mo MM MMM MMMM | D Do DD | H Ho HH | h ho hh | m mo mm | s so ss | SSS | d dd ddd dddd",
				{ locales: "en-US" },
			),
		).toBe(
			"2024th 24 2024 | 1 1st 01 Jan January | 2 2nd 02 | 15 15th 15 | 3 3rd 03 | 4 4th 04 | 5 5th 05 | 006 | 2 T Tue Tuesday",
		);
	});

	it.each([
		[1, "1st"],
		[2, "2nd"],
		[3, "3rd"],
		[4, "4th"],
		[11, "11th"],
		[12, "12th"],
		[13, "13th"],
		[21, "21st"],
		[22, "22nd"],
		[23, "23rd"],
	])("formats ordinal day %s", (day, expected) => {
		expect(formatDate(new Date(2024, 0, day), "Do")).toBe(expected);
	});

	it("formats locale names and tracks reactive inputs", () => {
		const date = signal(new Date(2022, 0, 1, 15, 5, 6));
		const format = signal("YYYY/MM/DD ddd");
		const locale = signal<Intl.LocalesArgument>("en-US");
		const result = useDateFormat(date, format, { locales: locale });

		expect(result.value).toBe("2022/01/01 Sat");

		format.value = "MMMM dddd";
		expect(result.value).toBe("January Saturday");

		locale.value = "ja-JP";
		expect(result.value).toBe("1月 土曜日");

		date.value = new Date(2022, 1, 2, 4, 3, 2);
		expect(result.value).toBe("2月 水曜日");
	});

	it("accepts getters and computed values", () => {
		const timestamp = signal(new Date(2022, 0, 1, 10, 24, 0).getTime());
		const format = computed(() => "YYYY-MM-DD HH:mm:ss");
		const result = useDateFormat(() => timestamp.value, format);

		expect(result.value).toBe("2022-01-01 10:24:00");

		timestamp.value = new Date(2022, 0, 2, 3, 4, 5).getTime();
		expect(result.value).toBe("2022-01-02 03:04:05");
	});

	it("formats default meridiem tokens", () => {
		const cases: Array<[Date, string, string]> = [
			[new Date(2022, 0, 1, 3, 5, 5), "hh:mm:ss A", "03:05:05 AM"],
			[new Date(2022, 0, 1, 3, 5, 5), "hh:mm:ss AA", "03:05:05 A.M."],
			[new Date(2022, 0, 1, 3, 5, 5), "hh:mm:ss a", "03:05:05 am"],
			[new Date(2022, 0, 1, 3, 5, 5), "hh:mm:ss aa", "03:05:05 a.m."],
			[new Date(2022, 0, 1, 15, 5, 5), "hh:mm:ss A", "03:05:05 PM"],
			[new Date(2022, 0, 1, 15, 5, 5), "hh:mm:ss AA", "03:05:05 P.M."],
			[new Date(2022, 0, 1, 15, 5, 5), "hh:mm:ss a", "03:05:05 pm"],
			[new Date(2022, 0, 1, 15, 5, 5), "hh:mm:ss aa", "03:05:05 p.m."],
		];

		for (const [date, format, expected] of cases) {
			expect(useDateFormat(date, format).value).toBe(expected);
		}
	});

	it("uses custom meridiem formatting", () => {
		const customMeridiem = (
			hours: number,
			_minutes: number,
			isLowercase?: boolean,
			hasPeriod?: boolean,
		) => {
			const value =
				hours > 11 ? (isLowercase ? "μμ" : "ΜΜ") : isLowercase ? "πμ" : "ΠΜ";

			return hasPeriod
				? value
						.split("")
						.reduce((accumulator, current) => `${accumulator}${current}.`, "")
				: value;
		};
		const cases: Array<[Date, string, string]> = [
			[new Date(2022, 0, 1, 3, 5, 5), "hh:mm:ss A", "03:05:05 ΠΜ"],
			[new Date(2022, 0, 1, 3, 5, 5), "hh:mm:ss AA", "03:05:05 Π.Μ."],
			[new Date(2022, 0, 1, 3, 5, 5), "hh:mm:ss a", "03:05:05 πμ"],
			[new Date(2022, 0, 1, 3, 5, 5), "hh:mm:ss aa", "03:05:05 π.μ."],
			[new Date(2022, 0, 1, 15, 5, 5), "hh:mm:ss A", "03:05:05 ΜΜ"],
			[new Date(2022, 0, 1, 15, 5, 5), "hh:mm:ss AA", "03:05:05 Μ.Μ."],
			[new Date(2022, 0, 1, 15, 5, 5), "hh:mm:ss a", "03:05:05 μμ"],
			[new Date(2022, 0, 1, 15, 5, 5), "hh:mm:ss aa", "03:05:05 μ.μ."],
		];

		for (const [date, format, expected] of cases) {
			expect(useDateFormat(date, format, { customMeridiem }).value).toBe(
				expected,
			);
		}
	});

	it("formats timezone offset tokens", () => {
		const date = new Date(2022, 0, 1, 15, 5, 6);
		const shortOffset = formatDate(date, "z", { locales: "en-US" });
		const longOffset = formatDate(date, "zzzz", { locales: "en-US" });

		expect(shortOffset).toMatch(/^GMT(?:[+-]\d{1,2}(?::?\d{2})?)?$/);
		expect(longOffset).toMatch(/^GMT(?:[+-]\d{2}:\d{2})?$/);
		expect(formatDate(date, "z zz zzz", { locales: "en-US" })).toBe(
			`${shortOffset} ${shortOffset} ${shortOffset}`,
		);
	});

	it("extracts timezone names from locale-aware parts", () => {
		const date = new Date("2022-01-01T00:00:00Z");
		const getTimeZoneName = (timeZoneName: "shortOffset" | "longOffset") =>
			new Intl.DateTimeFormat("ko-KR", { timeZoneName })
				.formatToParts(date)
				.find((part) => part.type === "timeZoneName")?.value ?? "";
		const shortOffset = getTimeZoneName("shortOffset");
		const longOffset = getTimeZoneName("longOffset");

		expect(
			date
				.toLocaleDateString("ko-KR", { timeZoneName: "shortOffset" })
				.split(" ")[1],
		).not.toBe(shortOffset);
		expect(formatDate(date, "z zzzz", { locales: "ko-KR" })).toBe(
			`${shortOffset} ${longOffset}`,
		);
	});

	it("formats invalid dates without throwing", () => {
		const invalid = new Date(Number.NaN);

		expect(formatDate(invalid, "YYYY-MM-DD HH:mm:ss")).toBe(
			"NaN-NaN-NaN NaN:NaN:NaN",
		);
		expect(useDateFormat("not-a-date", "YYYY-MM-DD HH:mm:ss").value).toBe(
			"NaN-NaN-NaN NaN:NaN:NaN",
		);
		expect(formatDate(invalid, "z zzzz", { locales: "en-US" })).toBe(
			"Date Date",
		);
	});

	it("uses HH:mm:ss by default", () => {
		expect(useDateFormat(new Date(2022, 0, 1, 10, 24, 0)).value).toBe(
			"10:24:00",
		);
	});
});
