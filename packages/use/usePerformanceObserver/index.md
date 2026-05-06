---
category: Browser
---

# usePerformanceObserver

Observe performance entries with `PerformanceObserver`.

## Usage

```ts
import { usePerformanceObserver } from "@sigrea/use";

const observer = usePerformanceObserver(
	{
		entryTypes: ["mark", "measure"],
	},
	(list) => {
		for (const entry of list.getEntries()) {
			console.log(entry.name, entry.entryType);
		}
	},
);

console.log(observer.isSupported.value);
observer.stop();
```

## Controls

```ts
const observer = usePerformanceObserver(
	{
		entryTypes: ["paint"],
		immediate: false,
	},
	(list) => {
		console.log(list.getEntries());
	},
);

observer.start();
observer.stop();
```

`start()` reconnects the observer with the same options. `stop()` disconnects
the current observer.

## Observe Options

```ts
usePerformanceObserver(
	{
		type: "resource",
		buffered: true,
	},
	(list) => {
		console.log(list.getEntries());
	},
);
```

`PerformanceObserver.observe()` does not allow `entryTypes` together with
`type`, `buffered`, or `durationThreshold`. Use `type` when `buffered` or
`durationThreshold` is needed.

Passing `window: null` disables observation instead of falling back to the
global window.
