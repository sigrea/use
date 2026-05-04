---
category: Reactivity
---

# computedEager

Eager computed signal without lazy evaluation.

VueUse marks this API as deprecated and plans to remove it in a future version,
but `@sigrea/core` computed signals are still lazy. Use this only when a value
must be updated eagerly before it is read.

## Usage

```ts
import { signal } from "@sigrea/core";
import { computedEager } from "@sigrea/use";

const count = signal(0);
const isOverFive = computedEager(() => count.value > 5);

console.log(isOverFive.value); // false

count.value = 6;
console.log(isOverFive.value); // true
```

`computedEager()` evaluates immediately and re-evaluates when dependencies read
by the callback change. The default `flush` is `"sync"`, matching VueUse.

VueUse also exposes the deprecated `eagerComputed` alias. `@sigrea/use` only
exports the original function name tracked in `coverage.md`.
