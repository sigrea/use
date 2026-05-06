---
category: Sensors
---

# useSwipe

Reactive swipe detection based on Touch Events.

## Usage

```ts
import { useSwipe } from "@sigrea/use";

const swipe = useSwipe(element, {
	threshold: 40,
});

console.log(swipe.isSwiping.value, swipe.direction.value);
```

`direction` is `"none"` until either horizontal or vertical movement reaches
the threshold.

## Cleanup

`stop()` removes listeners and clears the active swipe state. Passing `null` or
`undefined` as the target does not register listeners.
