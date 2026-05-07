---
category: Animation
related: useTimeoutFn, useIntervalFn
---

# useTimeoutPoll

Repeatedly runs an async callback with a timeout between completed runs.

## Usage

```ts
import { useTimeoutPoll } from "@sigrea/use";

const { pause, resume, isActive } = useTimeoutPoll(async () => {
	await fetch("/api/status");
}, 1000);

pause();
resume();

console.log(isActive.value);
```

The first timeout starts automatically by default. Pass `{ immediate: false }`
to start it manually, or `{ immediateCallback: true }` to run the callback
right after `resume()`.
