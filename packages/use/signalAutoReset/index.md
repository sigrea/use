---
category: State
---

# signalAutoReset

A writable signal that resets to the default value after a delay.

## Usage

```ts
import { signalAutoReset } from "@sigrea/use";

const message = signalAutoReset("default message", 1000);

message.value = "message has set";

// after 1000ms
console.log(message.value); // "default message"
```

`defaultValue` and `afterMs` can be raw values, signals, computed values, or
getters. The delay is resolved when assigning `.value`, and the default value is
resolved when the timer runs.

Object values are held as a shallow signal. Reassign `.value` to notify
dependents after changing an object.
