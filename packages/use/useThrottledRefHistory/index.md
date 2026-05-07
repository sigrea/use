---
category: State
related: useDebouncedRefHistory, useRefHistory
---

# useThrottledRefHistory

Shorthand for `useRefHistory` with throttled automatic commits.

## Usage

```ts
import { signal } from "@sigrea/core";
import { useThrottledRefHistory } from "@sigrea/use";

const counter = signal(0);
const { history, undo, redo } = useThrottledRefHistory(counter, {
	throttle: 1000,
});
```

The first source change is committed immediately. Later changes inside the same
throttle window are committed once at the end when `trailing` is enabled.

## Cleanup

`dispose()` stops history tracking and clears pending throttled commits.
