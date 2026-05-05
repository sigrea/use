# useArrayUnique

Reactive unique array.

The source array can be a raw array, signal, computed value, or getter. Array
items can also be signals or computed values.

## Usage

```ts
import { signal } from "@sigrea/core";
import { useArrayUnique } from "@sigrea/use";

const item1 = signal(0);
const item2 = signal(1);
const item3 = signal(1);
const item4 = signal(2);
const list = [item1, item2, item3, item4];
const result = useArrayUnique(list);

result.value; // [0, 1, 2]

item4.value = 1;
result.value; // [0, 1]
```

## Reactive Array

```ts
const list = signal([1, 2, 2, 3]);
const result = useArrayUnique(list);

result.value; // [1, 2, 3]

list.value = [1, 1, 2];
result.value; // [1, 2]
```

## Custom Comparison

```ts
const list = signal([
	{ id: 1, name: "foo" },
	{ id: 2, name: "bar" },
	{ id: 1, name: "baz" },
]);

const result = useArrayUnique(list, (value, otherValue) => {
	return value.id === otherValue.id;
});

result.value; // [{ id: 1, name: "foo" }, { id: 2, name: "bar" }]
```
