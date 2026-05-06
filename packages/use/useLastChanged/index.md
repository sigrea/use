---
category: State
---

# useLastChanged

Records the timestamp of the last change to a watched source.

## Usage

```ts
import { nextTick, signal } from "@sigrea/core";
import { useLastChanged } from "@sigrea/use";

const source = signal(0);
const lastChanged = useLastChanged(source);

console.log(lastChanged.value); // null

source.value = 1;
await nextTick();

console.log(lastChanged.value); // timestamp for the source change
```

## Watch Options

```ts
const lastChanged = useLastChanged(source, {
	flush: "sync",
});

source.value = 1;

console.log(lastChanged.value); // timestamp for the current change
```

`useLastChanged` accepts a Sigrea watch source: signal, readonly signal,
computed value, getter, or deep signal. The returned value is a readonly signal.

## Initial Value

```ts
const lastChanged = useLastChanged(source, {
	initialValue: Date.now(),
});
```
