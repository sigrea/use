---
category: Array
---

# useSorted

Reactive sorted array.

## Usage

```ts
import { useSorted } from "@sigrea/use";

const source = [10, 3, 5, 7, 2, 1, 8, 6, 9, 4];
const sorted = useSorted(source);

console.log(sorted.value); // [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
console.log(source); // [10, 3, 5, 7, 2, 1, 8, 6, 9, 4]
```

`useSorted` returns a readonly signal. It sorts a resolved copy of the source
array and does not mutate the original array.

## Compare Function

```ts
const users = [
	{ name: "John", age: 40 },
	{ name: "Jane", age: 20 },
	{ name: "Joe", age: 30 },
];

const sorted = useSorted(users, (first, second) => {
	return first.age - second.age;
});
```

You can also pass the comparison function through options.

```ts
const sorted = useSorted(users, {
	compareFn: (first, second) => first.age - second.age,
});
```

## Custom Sort

```ts
const sorted = useSorted(users, (first, second) => first.age - second.age, {
	sortFn: (list, compareFn) => list.sort(compareFn).reverse(),
});
```

`sortFn` receives a resolved copy of the array and the comparison function. It
can mutate that copy because the source array has already been detached.

## Source Values

The source array and its items can be signals, computed values, or getters.
Items are resolved before sorting, so `compareFn` and `sortFn` receive plain
values.
