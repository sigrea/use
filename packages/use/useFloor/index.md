# useFloor

Reactive `Math.floor`.

## Usage

```ts
import { signal } from "@sigrea/core";
import { useFloor } from "@sigrea/use";

const source = signal(1.8);
const floor = useFloor(source);

console.log(floor.value); // 1

source.value = 3.9;
console.log(floor.value); // 3
```

The argument can be a plain number, signal, computed value, or getter function.
