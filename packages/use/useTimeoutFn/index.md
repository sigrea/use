---
category: Animation
---

# useTimeoutFn

Wrapper for `setTimeout` with controls.

## Usage

```ts
import { useTimeoutFn } from "@sigrea/use";

const { isPending, start, stop } = useTimeoutFn(() => {
	/* ... */
}, 3000);
```

The timeout starts automatically by default. Pass `{ immediate: false }` to
start it manually.

```ts
import { useTimeoutFn } from "@sigrea/use";

const { start } = useTimeoutFn(
	(id: string) => {
		console.log(id);
	},
	3000,
	{ immediate: false },
);

start("job");
```
