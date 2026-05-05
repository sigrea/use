# useArrayFindIndex

Reactive `Array.findIndex`.

The source array can be a raw array, signal, computed value, or getter. Array
items can also be signals or computed values. The predicate receives each
resolved item and the original unresolved source array.

## Usage

```ts
import { signal } from "@sigrea/core";
import { useArrayFindIndex } from "@sigrea/use";

const first = signal(0);
const second = signal(2);
const third = signal(4);
const result = useArrayFindIndex([first, second, third], (value) => {
	return value % 2 === 0;
});

result.value; // 0

first.value = 1;
result.value; // 1
```

## Reactive Array

```ts
const list = signal([-1, -2]);
const result = useArrayFindIndex(list, (value) => value > 0);

result.value; // -1

list.value = [-1, 2, 3];
result.value; // 1
```
