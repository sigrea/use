# useArrayFind

Reactive `Array.find`.

The source array can be a raw array, signal, computed value, or getter. Array
items can also be signals or computed values. The result is the resolved first
matching item, or `undefined` when no item matches. The predicate receives each
resolved item and the original unresolved source array.

## Usage

```ts
import { signal } from "@sigrea/core";
import { useArrayFind } from "@sigrea/use";

const first = signal(1);
const second = signal(-1);
const third = signal(2);
const result = useArrayFind([first, second, third], (value) => {
	return value > 0;
});

result.value; // 1

first.value = -1;
result.value; // 2
```

## Reactive Array

```ts
const list = signal([-1, -2]);
const result = useArrayFind(list, (value) => value > 0);

result.value; // undefined

list.value = [-1, 2, 3];
result.value; // 2
```
