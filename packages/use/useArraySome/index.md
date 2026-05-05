# useArraySome

Reactive `Array.some`.

The source array can be a raw array, signal, computed value, or getter. Array
items can also be signals or computed values.

## Usage

```ts
import { signal } from "@sigrea/core";
import { useArraySome } from "@sigrea/use";

const item1 = signal(0);
const item2 = signal(2);
const item3 = signal(12);
const result = useArraySome([item1, item2, item3], (value) => {
	return value > 10;
});

result.value; // true

item3.value = 4;
result.value; // false
```

## Reactive Array

```ts
const list = signal([0, 2, 4, 6, 8]);
const result = useArraySome(list, (value) => value > 10);

result.value; // false

list.value = [0, 2, 11];
result.value; // true
```
