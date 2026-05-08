# useClamp

Reactively clamp a value between two other values.

## Usage

```ts
import { signal } from "@sigrea/core";
import { useClamp } from "@sigrea/use";

const source = signal(10);
const max = signal(100);
const clamped = useClamp(source, 0, max);

source.value = 120;
console.log(clamped.value); // 100

max.value = 80;
console.log(clamped.value); // 80
```

Plain numbers return a writable computed value. Signals, getters, computed
values, and readonly signals return a readonly computed value.
