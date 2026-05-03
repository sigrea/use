---
category: Animation
---

# useIntervalFn

Wrapper for `setInterval` with controls.

## Usage

```ts
import { useIntervalFn } from "@sigrea/use";

const { pause, resume, isActive } = useIntervalFn(() => {
	/* your function */
}, 1000);
```

The interval starts automatically by default. Pass `{ immediate: false }` to
start it manually.

```ts
import { useIntervalFn } from "@sigrea/use";

const { resume } = useIntervalFn(
	() => {
		/* your function */
	},
	1000,
	{ immediate: false },
);

resume();
```
