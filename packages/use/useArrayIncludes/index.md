# useArrayIncludes

Reactive `Array.includes`.

## Usage

```ts
import { signal } from "@sigrea/core";
import { useArrayIncludes } from "@sigrea/use";

const list = signal([0, 2, 4, 6, 8]);
const value = signal(10);
const result = useArrayIncludes(list, value);

result.value; // false

list.value = [0, 2, 4, 6, 8, 10];
result.value; // true
```

Array items and the search value may be signals, computed values, or getters.

## Comparator

Pass a key or comparator function when strict equality is not enough.

```ts
import { signal } from "@sigrea/core";
import { useArrayIncludes } from "@sigrea/use";

const list = signal([{ id: 1 }, { id: 2 }, { id: 3 }]);

const byKey = useArrayIncludes(list, 3, "id");
byKey.value; // true

const byFunction = useArrayIncludes(list, { id: 3 }, (element, value) => {
	return element.id === value.id;
});
byFunction.value; // true
```

The comparator receives the resolved item, the resolved search value, the index,
and the original source array for the search range. When `fromIndex` is set, the
index and source array are based on that sliced range.
