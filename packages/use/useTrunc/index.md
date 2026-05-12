# useTrunc

Reactive `Math.trunc`.

## Usage

```ts
import { signal } from "@sigrea/core";
import { useTrunc } from "@sigrea/use";

const source = signal(1.95);
const truncated = useTrunc(source);

console.log(truncated.value); // 1

source.value = -7.004;
console.log(truncated.value); // -7
```

The argument can be a plain number, signal, computed value, or getter function.
