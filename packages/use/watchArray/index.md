# watchArray

Watch an array and receive the added and removed items.

## Usage

```ts
import { signal } from "@sigrea/core";
import { watchArray } from "@sigrea/use";

const list = signal([1, 2, 3]);

const stop = watchArray(list, (newList, oldList, added, removed) => {
	console.log(newList); // [1, 2, 3, 4]
	console.log(oldList); // [1, 2, 3]
	console.log(added); // [4]
	console.log(removed); // []
});

list.value = [...list.value, 4];
stop();
```

Items are compared with `Object.is`. Duplicate values are counted separately.

## In-Place Array Changes

Use `deepSignal` with `deep: true` when the list is updated in place.

```ts
import { deepSignal } from "@sigrea/core";
import { watchArray } from "@sigrea/use";

const list = deepSignal([1, 2, 3]);

watchArray(
	list,
	(_newList, _oldList, added, removed) => {
		console.log(added); // [4]
		console.log(removed); // []
	},
	{ deep: true },
);

list.push(4);
```
