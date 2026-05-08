# useMin

Reactively get the minimum of values.

## Usage

```ts
import { signal } from "@sigrea/core";
import { useMin } from "@sigrea/use";

const left = signal(1);
const right = signal(3);
const min = useMin(left, right);

console.log(min.value); // 1

left.value = 5;
console.log(min.value); // 3
```

Arguments can be passed as rest values or as a single array source.
