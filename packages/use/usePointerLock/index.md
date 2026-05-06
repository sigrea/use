---
category: Sensors
---

# usePointerLock

Reactive Pointer Lock API controls.

## Usage

```ts
import { usePointerLock } from "@sigrea/use";

const pointerLock = usePointerLock(canvas);

button.addEventListener("click", () => {
	void pointerLock.lock();
});
```

Pointer lock requests should be made from a user action such as a click.

## Options

```ts
await pointerLock.lock({
	unadjustedMovement: true,
});
```

`requestPointerLock()` may return either a promise or nothing depending on the
browser. `usePointerLock` still syncs state from `pointerlockchange` and rejects
the pending action when `pointerlockerror` fires.

## Target

When `target` is omitted, `usePointerLock` uses `document.documentElement`.
Passing `target: null` or `document: null` disables pointer lock calls.
