---
category: Utilities
---

# isDefined

Non-nullish checking type guard for raw values and Sigrea signals.

## Usage

```ts
import { signal } from "@sigrea/core";
import { isDefined } from "@sigrea/use";

const value = signal<string | undefined>("ready");

if (isDefined(value)) {
	value.value.toUpperCase();
}
```

`null` and `undefined` are treated as missing. `0`, `false`, and `""` are
treated as defined.

Direct zero-argument functions are treated as getters. Wrap function values in a
signal or computed value when you want `isDefined()` to check the function
itself.
