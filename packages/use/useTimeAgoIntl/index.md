---
category: Time
---

# useTimeAgoIntl

Reactive relative time text backed by `Intl.RelativeTimeFormat`.

## Usage

```ts
import { useTimeAgoIntl } from "@sigrea/use";

const timeAgoIntl = useTimeAgoIntl(new Date("2026-05-07T00:00:00Z"), {
	locale: "en",
});

console.log(timeAgoIntl.value);
```

Use `controls: true` to pause the update loop or read the raw Intl parts.

```ts
const { timeAgoIntl, parts, pause, resume } = useTimeAgoIntl(Date.now(), {
	controls: true,
	locale: "en",
	updateInterval: 1000,
});
```

## Non-Reactive Formatting

```ts
import { formatTimeAgoIntl, formatTimeAgoIntlParts } from "@sigrea/use";

const label = formatTimeAgoIntl(new Date("2026-05-07T00:00:00Z"), {
	locale: "en",
});

const custom = formatTimeAgoIntlParts([
	{ type: "integer", value: "5", unit: "minute" },
	{ type: "literal", value: " minutes ago" },
], {
	insertSpace: false,
});
```
