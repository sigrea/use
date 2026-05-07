# logicAnd

Reactive `AND` for resolved values.

## Usage

```ts
import { signal } from "@sigrea/core";
import { logicAnd } from "@sigrea/use";

const ready = signal(true);
const enabled = signal(false);

const active = logicAnd(ready, enabled);

console.log(active.value); // false

enabled.value = true;
console.log(active.value); // true
```

Arguments can be plain values, signals, computed values, or getter functions.
With no arguments, the result is `true`, matching `Array.prototype.every`.
