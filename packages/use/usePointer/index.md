---
category: Sensors
---

# usePointer

Reactive Pointer Events state.

## Usage

```ts
import { usePointer } from "@sigrea/use";

const pointer = usePointer();

console.log(pointer.x.value, pointer.y.value);
console.log(pointer.pressure.value, pointer.pointerType.value);
```

`x` and `y` come from `PointerEvent.x` and `PointerEvent.y`, which are client
coordinates.

## Pointer Types

```ts
const pen = usePointer({
	pointerTypes: ["pen"],
});
```

`pointerTypes` filters the pointer events that update the state.

## Target

```ts
const pointer = usePointer({
	target: document.body,
});
```

When `target` is omitted, `usePointer` listens on the current window. Passing
`target: null` or `window: null` disables event listeners.
