---
category: Reactivity
related: syncSignal
---

# syncSignals

Keep one source in sync with one or more writable target signals.

## Usage

```ts
import { signal } from "@sigrea/core";
import { syncSignals } from "@sigrea/use";

const source = signal("source");
const target = signal("target");

const stop = syncSignals(source, target);

console.log(target.value); // "source"

source.value = "next";
console.log(target.value); // "next"

stop();
```

### Multiple Targets

```ts
const source = signal("source");
const first = signal("first");
const second = signal("second");

syncSignals(source, [first, second]);
```

`syncSignals()` follows VueUse `syncRefs()` defaults: `immediate: true`,
`deep: false`, and `flush: "sync"`.

The source can be any `@sigrea/core` watch source. Targets must be writable
signals. Readonly signals and computed values are rejected as targets because
they do not expose a safe writable destination.
