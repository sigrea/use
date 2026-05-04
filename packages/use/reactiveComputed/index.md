---
category: Reactivity
---

# reactiveComputed

Computed deep-signal object.

## Usage

```ts
import { signal } from "@sigrea/core";
import { reactiveComputed } from "@sigrea/use";

const count = signal(0);
const state = reactiveComputed(() => ({
	count,
	label: count.value > 0 ? "ready" : "idle",
}));

console.log(state.count); // 0
console.log(state.label); // idle

count.value = 1;

console.log(state.count); // 1
console.log(state.label); // ready
```

`reactiveComputed()` returns a deep signal object, so signal properties are
unwrapped when read and writes are forwarded to the current computed object.
