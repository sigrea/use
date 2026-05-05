# useCycleList

Cycle through a list of items.

## Usage

```ts
import { useCycleList } from "@sigrea/use";

const { state, next, prev, go } = useCycleList([
	"Dog",
	"Cat",
	"Lizard",
	"Shark",
]);

state.value; // "Dog"

prev();
state.value; // "Shark"

go(2);
state.value; // "Lizard"
```

The list and list items may be raw values, signals, computed values, or getters.

## Options

```ts
import { signal } from "@sigrea/core";
import { useCycleList } from "@sigrea/use";

const fallbackIndex = signal(0);
const cycle = useCycleList(
	[
		{ id: 1, label: "one" },
		{ id: 2, label: "two" },
	],
	{
		fallbackIndex,
		initialValue: { id: 2, label: "selected" },
		getIndexOf(value, list) {
			return list.findIndex((item) => item.id === value?.id);
		},
	},
);

cycle.index.value; // 1
```
