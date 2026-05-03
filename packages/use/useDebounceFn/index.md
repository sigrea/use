---
category: Utilities
related: useThrottleFn
---

# useDebounceFn

Debounce execution of a function.

## Usage

```ts
import { useDebounceFn } from "@sigrea/use";

const debouncedFn = useDebounceFn(() => {
	// do something
}, 1000);

debouncedFn();
```

The returned function resolves with the callback result.

```ts
const debouncedRequest = useDebounceFn(() => "response", 1000);

const value = await debouncedRequest();
console.log(value); // "response"
```

## Options

```ts
const debouncedFn = useDebounceFn(
	() => {
		// do something
	},
	1000,
	{
		maxWait: 5000,
		rejectOnCancel: true,
	},
);
```

By default, a canceled call resolves without a value. Pass
`rejectOnCancel: true` to reject canceled calls.
