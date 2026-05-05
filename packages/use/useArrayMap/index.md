# useArrayMap

Reactive `Array.map`.

## Usage

```ts
import { signal } from "@sigrea/core";
import { useArrayMap } from "@sigrea/use";

const first = signal(0);
const second = signal(2);
const third = signal(4);

const doubled = useArrayMap([first, second, third], (value) => value * 2);

doubled.value; // [0, 4, 8]

first.value = 1;
doubled.value; // [2, 4, 8]
```

## Reactive Arrays

Pass a signal, computed value, or getter when the source array itself changes.

```ts
import { signal } from "@sigrea/core";
import { useArrayMap } from "@sigrea/use";

const list = signal([0, 1, 2, 3, 4]);
const doubled = useArrayMap(list, (value) => value * 2);

doubled.value; // [0, 2, 4, 6, 8]

list.value = [0, 1, 2, 3];
doubled.value; // [0, 2, 4, 6]
```

The callback receives the resolved item, its index, and the resolved source
array.
