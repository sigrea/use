# useCeil

Reactive `Math.ceil`.

## Usage

```ts
import { signal } from "@sigrea/core";
import { useCeil } from "@sigrea/use";

const source = signal(1.2);
const ceiling = useCeil(source);

console.log(ceiling.value); // 2

source.value = 3.1;
console.log(ceiling.value); // 4
```

The argument can be a plain number, signal, computed value, or getter function.
