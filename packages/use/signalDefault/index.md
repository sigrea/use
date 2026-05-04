---
category: State
---

# signalDefault

Applies a default value while a writable signal source is `null` or
`undefined`.

## Usage

```ts
import { signal } from "@sigrea/core";
import { signalDefault } from "@sigrea/use";

const raw = signal<string | undefined>();
const state = signalDefault(raw, "default");

console.log(state.value); // "default"

raw.value = "hello";
console.log(state.value); // "hello"

state.value = "updated";
console.log(raw.value); // "updated"
```

`defaultValue` is returned as-is while the source value is `null` or
`undefined`.

The source must be a writable signal because assignments to the returned signal
are written back to the source. Non-writable sources are rejected at runtime.
