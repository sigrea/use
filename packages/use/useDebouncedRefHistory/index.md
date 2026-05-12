---
category: State
related:
  - useRefHistory
---

# useDebouncedRefHistory

Shorthand for `useRefHistory` with debounced automatic commits.

## Usage

```ts
import { signal } from "@sigrea/core";
import { useDebouncedRefHistory } from "@sigrea/use";

const counter = signal(0);
const { history, undo, redo } = useDebouncedRefHistory(counter, {
	debounce: 1000,
});

counter.value = 1;
```

`history` receives the latest source value after the debounce delay. Manual
`commit()`, `undo()`, and `redo()` keep the same behavior as `useRefHistory`.
