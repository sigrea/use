# useArrayFilter

Reactive `Array.filter`.

The source array can be a raw array, signal, computed value, or getter. Array
items can also be signals or computed values. The predicate receives resolved
items and the resolved array.

## Usage

```ts
import { signal } from "@sigrea/core";
import { useArrayFilter } from "@sigrea/use";

const list = signal([0, 1, 2, 3, 4, 5]);
const result = useArrayFilter(list, (value) => value % 2 === 0);

result.value; // [0, 2, 4]

list.value = [1, 2, 3, 4, 5, 6];
result.value; // [2, 4, 6]
```

## Reactive Items

```ts
const first = signal(0);
const second = signal(1);
const third = signal(2);

const result = useArrayFilter([first, second, third], (value) => {
	return value % 2 === 0;
});

result.value; // [0, 2]

second.value = 4;
result.value; // [0, 4, 2]
```
