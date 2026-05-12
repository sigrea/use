---
category: Time
---

# useTimeAgo

Reactive relative time text.

## Usage

```ts
import { useTimeAgo } from "@sigrea/use";

const timeAgo = useTimeAgo(new Date("2026-05-07T00:00:00Z"));

console.log(timeAgo.value);
```

Use `controls: true` when the update loop needs to be paused or resumed.

```ts
const { timeAgo, pause, resume } = useTimeAgo(Date.now(), {
	controls: true,
	showSecond: true,
	updateInterval: 1000,
});
```

## Non-Reactive Formatting

```ts
import { formatTimeAgo } from "@sigrea/use";

const label = formatTimeAgo(new Date("2026-05-07T00:00:00Z"));
```
