# useSum

Reactively get the sum of values.

## Usage

```ts
import { signal } from "@sigrea/core";
import { useSum } from "@sigrea/use";

const values = signal([1, 2, 3, 4]);
const sum = useSum(values);

console.log(sum.value); // 10

values.value = [-1, -2, 3, 4];
console.log(sum.value); // 4
```

Arguments can be passed as rest values or as a single array source.
