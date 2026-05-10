---
category: Reactivity
---

# computedWithControl

Computed signal whose updates are controlled by explicit watch sources.

## Usage

```ts
import { signal } from "@sigrea/core";
import { computedWithControl } from "@sigrea/use";

const source = signal("foo");
const counter = signal(0);

const value = computedWithControl(
	source,
	() => counter.value,
);

console.log(value.value); // 0

counter.value += 1;
console.log(value.value); // 0

source.value = "bar";
console.log(value.value); // 1
```

The getter receives the previous value, matching VueUse.

```ts
const trigger = signal(0);
const doubled = computedWithControl(trigger, (oldValue?: number) =>
	oldValue === undefined ? 1 : oldValue * 2,
);

console.log(doubled.value); // 1

trigger.value += 1;
console.log(doubled.value); // 2
```

## Manual Triggering

```ts
let count = 0;
const value = computedWithControl(() => count, () => count);

count += 1;
console.log(value.value); // 0

value.trigger();
console.log(value.value); // 1
```

## Writable Values

```ts
const source = signal(0);
const text = signal("foo");

const value = computedWithControl(source, {
	get: () => text.value.toUpperCase(),
	set: (next) => {
		text.value = next;
	},
});

value.value = "bar";
console.log(text.value); // "bar"
```

Like VueUse, source watches are shallow by default. Pass `deep: true` when
nested writes on a deep signal should refresh the value.

VueUse also exposes the deprecated `controlledComputed` alias. `@sigrea/use`
only exports the original function name tracked in `coverage.md`.
