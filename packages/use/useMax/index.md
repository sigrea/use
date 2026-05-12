# useMax

Reactively get the maximum of values.

## Usage

```ts
import { signal } from "@sigrea/core";
import { useMax } from "@sigrea/use";

const left = signal(1);
const right = signal(3);
const max = useMax(left, right);

console.log(max.value); // 3

left.value = 5;
console.log(max.value); // 5
```

Arguments can be passed as rest values or as a single array source.
