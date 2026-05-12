---
category: Time
---

# useDateFormat

Format a `Date`, timestamp, or date string with reactive format tokens.

## Usage

```ts
import { signal } from "@sigrea/core";
import { useDateFormat } from "@sigrea/use";

const date = signal(new Date(2022, 0, 1, 10, 24, 0));
const formatted = useDateFormat(date, "YYYY-MM-DD HH:mm:ss");

formatted.value; // "2022-01-01 10:24:00"

date.value = new Date(2022, 0, 2, 3, 4, 5);
formatted.value; // "2022-01-02 03:04:05"
```

## Format Tokens

Default format is `HH:mm:ss`.

| Token | Output | Description |
| --- | --- | --- |
| `Yo` | `2022nd` | Ordinal year |
| `YY` | `22` | Two-digit year |
| `YYYY` | `2022` | Four-digit year |
| `M` | `1` | Month, starting at 1 |
| `Mo` | `1st` | Ordinal month |
| `MM` | `01` | Two-digit month |
| `MMM` | `Jan` | Short month name |
| `MMMM` | `January` | Long month name |
| `D` | `1` | Day of month |
| `Do` | `1st` | Ordinal day of month |
| `DD` | `01` | Two-digit day of month |
| `H` | `15` | 24-hour clock hour |
| `Ho` | `15th` | Ordinal 24-hour clock hour |
| `HH` | `15` | Two-digit 24-hour clock hour |
| `h` | `3` | 12-hour clock hour |
| `ho` | `3rd` | Ordinal 12-hour clock hour |
| `hh` | `03` | Two-digit 12-hour clock hour |
| `m` | `5` | Minute |
| `mo` | `5th` | Ordinal minute |
| `mm` | `05` | Two-digit minute |
| `s` | `6` | Second |
| `so` | `6th` | Ordinal second |
| `ss` | `06` | Two-digit second |
| `SSS` | `009` | Three-digit millisecond |
| `A` | `AM` / `PM` | Meridiem |
| `AA` | `A.M.` / `P.M.` | Meridiem with periods |
| `a` | `am` / `pm` | Lowercase meridiem |
| `aa` | `a.m.` / `p.m.` | Lowercase meridiem with periods |
| `d` | `0`-`6` | Day of week, Sunday as 0 |
| `dd` | `S` | Narrow weekday name |
| `ddd` | `Sat` | Short weekday name |
| `dddd` | `Saturday` | Long weekday name |
| `z` | `GMT+9` | Short timezone offset |
| `zz` | `GMT+9` | Short timezone offset |
| `zzz` | `GMT+9` | Short timezone offset |
| `zzzz` | `GMT+09:00` | Long timezone offset |

Wrap literal text in square brackets.

```ts
import { useDateFormat } from "@sigrea/use";

const formatted = useDateFormat(
	new Date(2022, 0, 1, 15, 5, 0),
	"YYYY-MM-DD [at] hh:mm A",
);

formatted.value; // "2022-01-01 at 03:05 PM"
```

## Locales

`locales` accepts the same value as `Intl.DateTimeFormat` and can be a signal,
computed value, or getter.

```ts
import { signal } from "@sigrea/core";
import { useDateFormat } from "@sigrea/use";

const locale = signal<Intl.LocalesArgument>("en-US");
const formatted = useDateFormat(new Date(2022, 0, 1), "MMMM dddd", {
	locales: locale,
});

formatted.value; // "January Saturday"

locale.value = "ja-JP";
formatted.value; // "1月 土曜日"
```

## Custom Meridiem

```ts
import { useDateFormat } from "@sigrea/use";

function customMeridiem(
	hours: number,
	_minutes: number,
	isLowercase?: boolean,
	hasPeriod?: boolean,
) {
	const value = hours > 11 ? (isLowercase ? "μμ" : "ΜΜ") : "ΠΜ";

	return hasPeriod
		? value
				.split("")
				.reduce((acc, current) => acc + `${current}.`, "")
		: value;
}

const formatted = useDateFormat(
	new Date(2022, 0, 1, 15, 5, 5),
	"hh:mm:ss AA",
	{ customMeridiem },
);

formatted.value; // "03:05:05 Μ.Μ."
```
