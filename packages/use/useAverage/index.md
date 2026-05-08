# useAverage

Reactive average of resolved numbers.

## Usage

```ts
import { signal } from "@sigrea/core";
import { useAverage } from "@sigrea/use";

const left = signal(1);
const right = signal(3);
const average = useAverage(left, right);

console.log(average.value); // 2

right.value = 5;
console.log(average.value); // 3
```

Pass numbers as rest arguments, or pass an array. Array entries can also be
plain numbers, signals, computed values, or getter functions.
