---
category: Utilities
related: useDebounceFn
---

# useThrottleFn

Throttle execution of a function.

## Usage

```ts
import { useThrottleFn } from "@sigrea/use";

const throttledFn = useThrottleFn(() => {
	// do something
}, 1000);

throttledFn();
```

The returned function resolves with the callback result.

```ts
const throttledRequest = useThrottleFn(() => "response", 1000);

const value = await throttledRequest();
console.log(value); // "response"
```

## Options

```ts
const throttledFn = useThrottleFn(
	() => {
		// do something
	},
	1000,
	true, // trailing
	true, // leading
	true, // rejectOnCancel
);
```

Defaults are `trailing: false`, `leading: true`, and
`rejectOnCancel: false`.
