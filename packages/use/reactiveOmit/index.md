---
category: Reactivity
---

# reactiveOmit

Reactively omit fields from an object.

## Usage

```ts
import { deepSignal } from "@sigrea/core";
import { reactiveOmit } from "@sigrea/use";

const source = deepSignal({
	foo: "foo",
	bar: "bar",
	baz: "baz",
});

const state = reactiveOmit(source, "bar");

console.log(state.foo); // foo
console.log("bar" in state); // false

state.foo = "next";

console.log(source.foo); // next
```

## Predicate

```ts
import { reactiveOmit } from "@sigrea/use";

const state = reactiveOmit(source, (value, key) => key === "baz" || value === true);
```

The returned object updates with the source object and forwards writes for
included keys back to the source.
