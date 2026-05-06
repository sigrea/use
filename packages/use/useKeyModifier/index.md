---
category: Sensors
---

# useKeyModifier

Tracks a keyboard modifier state reported by browser events.

## Usage

```ts
import { useKeyModifier } from "@sigrea/use";

const capsLock = useKeyModifier("CapsLock");

console.log(capsLock.value);
```

The value is `null` until the first event with `getModifierState()` is received.

## Initial Value

```ts
const shift = useKeyModifier("Shift", {
	initial: false,
});
```

Passing a boolean initial value narrows the returned signal to `boolean`.

## Events

```ts
const capsLock = useKeyModifier("CapsLock", {
	events: ["keydown", "keyup"],
});
```

The default events are `mousedown`, `mouseup`, `keydown`, and `keyup`.

## Document Injection

```ts
const capsLock = useKeyModifier("CapsLock", {
	document: null,
});
```

Passing `document: null` disables the browser document fallback for SSR and
tests.
