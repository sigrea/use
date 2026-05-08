# logicOr

Reactive `OR` for resolved values.

## Usage

```ts
import { signal } from "@sigrea/core";
import { logicOr } from "@sigrea/use";

const ready = signal(false);
const enabled = signal(true);

const active = logicOr(ready, enabled);

console.log(active.value); // true
```

Arguments can be plain values, signals, computed values, or getter functions.
With no arguments, the result is `false`, matching `Array.prototype.some`.
