---
category: Utilities
---

# useCounter

Basic counter with utility functions.

## Usage

```ts
import { useCounter } from "@sigrea/use";

const { count, inc, dec, set, reset } = useCounter();
```

## Usage with options

```ts
import { useCounter } from "@sigrea/use";

const { count, inc, dec, set, reset } = useCounter(1, {
	min: 0,
	max: 10,
	step: 2,
});
```
