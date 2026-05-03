---
category: Animation
---

# useTimeout

Reactive value that becomes `true` after a given time.

## Usage

```ts
import { useTimeout } from "@sigrea/use";

const ready = useTimeout(1000);

console.log(ready.value); // false
```

After 1 second, `ready.value` becomes `true`.

## With Controls

```ts
import { useTimeout } from "@sigrea/use";

const { ready, start, stop, isPending } = useTimeout(1000, {
	controls: true,
});

stop();
start();

console.log(ready.value);
console.log(isPending.value);
```

Pass `{ immediate: false }` to start it manually. Use `callback` to run code
when the timeout completes.
