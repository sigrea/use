# useArrayFindLast

Reactive `Array.findLast`.

## Usage

```ts
import { signal } from "@sigrea/core";
import { useArrayFindLast } from "@sigrea/use";

const first = signal(1);
const second = signal(-1);
const third = signal(2);

const positive = useArrayFindLast([first, second, third], (value) => {
	return value > 0;
});

positive.value; // 2
```

## Reactive Arrays

Pass a signal, computed value, or getter when the source array itself changes.

```ts
import { signal } from "@sigrea/core";
import { useArrayFindLast } from "@sigrea/use";

const list = signal([-1, -2]);
const positive = useArrayFindLast(list, (value) => value > 0);

positive.value; // undefined

list.value = [-1, 10];
positive.value; // 10

list.value = [-1, 10, 5];
positive.value; // 5
```

Array items may also be signals, computed values, or getters. The predicate
receives the resolved item, its index, and the original source array.
