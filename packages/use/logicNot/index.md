# logicNot

Reactive `NOT` for a resolved value.

## Usage

```ts
import { signal } from "@sigrea/core";
import { logicNot } from "@sigrea/use";

const ready = signal(false);
const waiting = logicNot(ready);

console.log(waiting.value); // true

ready.value = true;
console.log(waiting.value); // false
```

The argument can be a plain value, signal, computed value, or getter function.
