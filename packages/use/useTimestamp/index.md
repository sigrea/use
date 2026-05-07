---
category: Animation
related: useRafFn, useIntervalFn
---

# useTimestamp

Reactive current timestamp.

## Usage

```ts
import { useTimestamp } from "@sigrea/use";

const timestamp = useTimestamp({ offset: 0 });

console.log(timestamp.value);
```

## Controls

```ts
import { useTimestamp } from "@sigrea/use";

const { timestamp, pause, resume, isActive } = useTimestamp({
	controls: true,
	interval: 1000,
});

console.log(timestamp.value);
console.log(isActive.value);

pause();
resume();
```

By default, the value updates with `requestAnimationFrame`. Pass a numeric
`interval` to update with `setInterval`, or pass `scheduler` to fully control
when updates run. When `scheduler` is provided, it owns the timing and active
state.
