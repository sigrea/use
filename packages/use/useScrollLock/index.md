---
category: Sensors
---

# useScrollLock

Lock scrolling of an element.

## Usage

```ts
import { useScrollLock } from "@sigrea/use";

const isLocked = useScrollLock(document.body);

isLocked.value = true;
isLocked.value = false;

isLocked.stop();
```

The returned value is a writable computed boolean. Setting it to `true` writes
`overflow: hidden` to the target and setting it to `false` restores the previous
inline `overflow` value.

```ts
const isLocked = useScrollLock(element, true);

console.log(isLocked.value);
```

## Target

`Window` and `Document` targets resolve to `document.documentElement`. When a
signal target changes while locked, the previous element is restored before the
new element is locked.

## Touch Scrolling

On iOS-like browsers, `useScrollLock` also listens for `touchmove` with
`passive: false` and prevents page scrolling. Touch events inside a scrollable
child are left alone so nested scroll areas can still move.

## SSR

Pass `window: null` or a `null` target when no browser window is available. A
direct element target can still be locked, but browser-only touch handling is not
attached.
