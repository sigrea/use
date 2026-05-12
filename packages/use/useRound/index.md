# useRound

Reactive `Math.round`.

## Usage

```ts
import { signal } from "@sigrea/core";
import { useRound } from "@sigrea/use";

const source = signal(20.49);
const rounded = useRound(source);

console.log(rounded.value); // 20

source.value = 20.51;
console.log(rounded.value); // 21
```

The argument can be a plain number, signal, computed value, or getter function.
