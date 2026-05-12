# useArrayEvery

Reactive `Array.every`.

The source array can be a raw array, signal, computed value, or getter. Array
items can also be signals or computed values.

## Usage

```ts
import { signal } from "@sigrea/core";
import { useArrayEvery } from "@sigrea/use";

const item1 = signal(0);
const item2 = signal(2);
const item3 = signal(4);
const result = useArrayEvery([item1, item2, item3], (value) => {
	return value % 2 === 0;
});

result.value; // true

item1.value = 1;
result.value; // false
```

## Reactive Array

```ts
const list = signal([0, 2, 4, 6, 8]);
const result = useArrayEvery(list, (value) => value % 2 === 0);

result.value; // true

list.value = [0, 2, 4, 6, 9];
result.value; // false
```
