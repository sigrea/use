---
category: Sensors
---

# usePointerSwipe

Reactive swipe detection based on Pointer Events.

## Usage

```ts
import { usePointerSwipe } from "@sigrea/use";

const swipe = usePointerSwipe(element, {
	threshold: 40,
});

console.log(swipe.isSwiping.value, swipe.direction.value);
```

`direction` is `"none"` until either horizontal or vertical movement reaches
the threshold.

## Pointer Types

```ts
const touchSwipe = usePointerSwipe(element, {
	pointerTypes: ["touch"],
});
```

`pointerTypes` filters `PointerEvent.pointerType`.

## Cleanup

`stop()` removes listeners and clears the active swipe state. Passing `null` or
`undefined` as the target does not register listeners.
