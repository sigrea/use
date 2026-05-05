---
category: Watch
---

# until

Promised one-time watch for a source to match a condition.

## Usage

```ts
import { signal } from "@sigrea/core";
import { until } from "@sigrea/use";

const count = signal(0);

setTimeout(() => {
	count.value = 8;
}, 100);

await until(count).toMatch((value) => value > 7);
```

`until()` returns helpers such as `toBe()`, `toMatch()`, `changed()`,
`changedTimes()`, `toBeTruthy()`, `toBeNull()`, and `toBeUndefined()`.

```ts
await until(count).toBe(10, { timeout: 1000 });
await until(count).not.toBe(0);
```

When `timeout` is set, the promise resolves with the current value after the
timeout. Set `throwOnTimeout: true` to reject with `"Timeout"` instead.
