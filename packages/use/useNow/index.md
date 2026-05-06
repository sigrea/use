---
category: Sensors
related: useIntervalFn
---

# useNow

Reactive current `Date`.

## Usage

```ts
import { useNow } from "@sigrea/use";

const now = useNow();

console.log(now.value);
```

## Controls

```ts
import { useNow } from "@sigrea/use";

const { now, pause, resume, isActive } = useNow({
	controls: true,
	interval: 1000,
});

console.log(now.value);
console.log(isActive.value);

pause();
resume();
```

By default, the value updates with `requestAnimationFrame`. Pass a numeric
`interval` to update with `setInterval`, or pass `scheduler` to fully control
when updates run. When `scheduler` is provided, it owns the timing and active
state.
