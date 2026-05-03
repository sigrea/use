---
category: State
---

# usePrevious

Holds the previous value of a watched value.

## Usage

```ts
import { signal } from "@sigrea/core";
import { usePrevious } from "@sigrea/use";

const counter = signal("Hello");
const previous = usePrevious(counter);

console.log(previous.value); // undefined

counter.value = "World";

console.log(previous.value); // Hello
```

## Initial Value

```ts
const previous = usePrevious(counter, "initial");

console.log(previous.value); // initial
```
