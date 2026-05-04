---
category: State
related: useThrottleFn
---

# signalThrottled

A readonly signal that rate-limits source value changes.

## Usage

```ts
import { signal } from "@sigrea/core";
import { signalThrottled } from "@sigrea/use";

const source = signal("");
const throttled = signalThrottled(source, 1000);

source.value = "first";
console.log(throttled.value); // "first"

source.value = "second";
source.value = "third";
console.log(throttled.value); // "first"

// after 1000ms
console.log(throttled.value); // "third"
```

`ms` can be a raw value, signal, computed value, or getter. The delay is
resolved when the source value changes.

`value` can be a raw value, signal, readonly signal, computed value, or getter.
Raw values are used only as the initial value. Reactive values and getters are
watched with synchronous flush timing.

By default, updates run on both the leading and trailing edges. Pass
`trailing: false` as the third argument to skip the trailing update, or
`leading: false` as the fourth argument to delay the first update.

The returned value is readonly. Update the source signal instead.

Object values are held as a shallow signal. Changing a nested property alone
does not notify dependents; reassign the source value to notify watchers.
