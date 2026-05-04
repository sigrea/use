---
category: State
---

# signalDebounced

A readonly signal that updates after the source value stops changing for a
delay.

## Usage

```ts
import { signal } from "@sigrea/core";
import { signalDebounced } from "@sigrea/use";

const source = signal("initial");
const debounced = signalDebounced(source, 1000);

source.value = "updated";

console.log(debounced.value); // "initial"

// after 1000ms
console.log(debounced.value); // "updated"
```

`ms` and `options.maxWait` can be raw values, signals, computed values, or
getters. The delay is resolved when the source value changes.

`value` can be a raw value, signal, readonly signal, computed value, or getter.
Raw values are used only as the initial value. Reactive values and getters are
watched with synchronous flush timing.

The returned value is readonly. Update the source signal instead.

Object values are held as a shallow signal. Changing a nested property alone
does not notify dependents; reassign the source value to notify watchers.
