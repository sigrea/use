---
category: State
---

# signalManualReset

A writable signal that can be reset to its default value manually.

## Usage

```ts
import { signalManualReset } from "@sigrea/use";

const message = signalManualReset("default message");

message.value = "message has set";

message.reset();

console.log(message.value); // "default message"
```

`defaultValue` can be a raw value, signal, readonly signal, computed value, or
getter. It is resolved when the signal is created and again when `reset()` runs.

Bare zero-argument functions are treated as getters. Wrap a function in a signal
or computed value when the function itself should be stored.

Object values are held as a shallow signal. Reassign `.value` to notify
dependents after changing an object.
