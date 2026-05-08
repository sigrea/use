# useAbs

Reactive `Math.abs`.

## Usage

```ts
import { signal } from "@sigrea/core";
import { useAbs } from "@sigrea/use";

const source = signal(-2);
const absolute = useAbs(source);

console.log(absolute.value); // 2

source.value = 3;
console.log(absolute.value); // 3
```

The argument can be a plain number, signal, computed value, or getter function.
