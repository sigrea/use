---
category: Reactivity
---

# syncSignal

Synchronize two writable signals.

## Usage

```ts
import { signal } from "@sigrea/core";
import { syncSignal } from "@sigrea/use";

const left = signal("left");
const right = signal("right");

const stop = syncSignal(left, right);

console.log(right.value); // "left"

right.value = "updated";
console.log(left.value); // "updated"

stop();
```

### One Direction

```ts
const stop = syncSignal(left, right, { direction: "rtl" });
```

### Custom Transform

```ts
const count = signal(10);
const text = signal("10");

syncSignal(count, text, {
	transform: {
		ltr: (value) => String(value),
		rtl: (value) => Number(value),
	},
});
```

`syncSignal()` follows VueUse `syncRef()` defaults: `immediate: true`,
`deep: false`, and `flush: "sync"`.

Both endpoints must be writable signals. Readonly signals and computed values
are rejected because `@sigrea/core` does not expose a public type that can
distinguish writable computed values from readonly computed values.
