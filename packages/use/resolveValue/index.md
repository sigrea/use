---
category: Utilities
related: createResolveValueFn
---

# resolveValue

Resolve a raw value, signal, readonly signal, computed value, or getter to its
current value.

VueUse exposes a similar helper as `get()`. Sigrea core already uses `get()` for
molecules, so `@sigrea/use` exposes this helper as `resolveValue()` instead.

## Usage

```ts
import { signal } from "@sigrea/core";
import { resolveValue } from "@sigrea/use";

const count = signal(42);
const factory = signal(() => "ready");

console.log(resolveValue(count)); // 42
console.log(resolveValue(() => count.value + 1)); // 43
console.log(resolveValue(factory)); // () => "ready"
```

Direct zero-argument functions are treated as getters. Wrap function values in a
signal when you want to keep the function itself.
