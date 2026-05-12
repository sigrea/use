# useArrayDifference

Reactive array difference.

By default, it returns the relative difference of the first array from the
second array. Pass `symmetric: true` to include values that exist only in the
second array.

## Usage

```ts
import { signal } from "@sigrea/core";
import { useArrayDifference } from "@sigrea/use";

const list = signal([0, 1, 2, 3, 4, 5]);
const values = signal([4, 5, 6]);
const result = useArrayDifference(list, values);

result.value; // [0, 1, 2, 3]

values.value = [0, 1, 2];
result.value; // [3, 4, 5]
```

## Custom Comparison

Use an object key or a comparison function when array items should be compared
by a specific field.

```ts
const list = signal([{ id: 1 }, { id: 2 }, { id: 3 }]);
const values = signal([{ id: 3 }]);

const byKey = useArrayDifference(list, values, "id");
const byFunction = useArrayDifference(
	list,
	values,
	(value, otherValue) => value.id === otherValue.id,
);
```

## Symmetric Difference

```ts
const list = signal([{ id: 1 }, { id: 2 }, { id: 3 }]);
const values = signal([{ id: 3 }, { id: 4 }]);

const result = useArrayDifference(list, values, "id", {
	symmetric: true,
});

result.value; // [{ id: 1 }, { id: 2 }, { id: 4 }]
```
