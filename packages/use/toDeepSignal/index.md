---
category: Reactivity
---

# toDeepSignal

Converts a plain object or plain object signal into a deep signal object.

## Usage

```ts
import { signal } from "@sigrea/core";
import { toDeepSignal } from "@sigrea/use";

const source = signal({ foo: "bar" });
const state = toDeepSignal(source);

console.log(state.foo); // "bar"

source.value = { foo: "next" };

console.log(state.foo); // "next"

state.foo = "updated";

console.log(source.value.foo); // "updated"
```

Signal properties are unwrapped when read. Assignments to writable signal
properties are written back to the original signal.

`toDeepSignal()` is for plain object sources whose whole object may be replaced.
Arrays and collections should be modeled directly with `deepSignal()` instead.
