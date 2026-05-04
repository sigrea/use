---
category: Reactivity
---

# reactivePick

Reactively pick fields from an object.

## Usage

```ts
import { deepSignal } from "@sigrea/core";
import { reactivePick } from "@sigrea/use";

const source = deepSignal({
	foo: "foo",
	bar: "bar",
	baz: "baz",
});

const state = reactivePick(source, "foo", "baz");

console.log(state.foo); // foo
console.log("bar" in state); // false

state.foo = "next";

console.log(source.foo); // next
```

## Predicate

```ts
import { reactivePick } from "@sigrea/use";

const state = reactivePick(source, (value, key) => key !== "bar" && value !== true);
```

The returned object updates with the source object and forwards writes for
included keys back to the source.
