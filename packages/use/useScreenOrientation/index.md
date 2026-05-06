---
category: Browser
---

# useScreenOrientation

Reactive `screen.orientation`. It reads the current orientation type and angle,
then updates when the browser fires orientation change events.

## Usage

```ts
import { useScreenOrientation } from "@sigrea/use";

const orientation = useScreenOrientation();

console.log(orientation.isSupported.value);
console.log(orientation.orientation.value);
console.log(orientation.angle.value);
```

## Locking

`lockOrientation()` delegates to `screen.orientation.lock()` and returns its
promise. Browsers can reject it when the document is not fullscreen, hidden, or
not allowed to lock orientation.

```ts
button.addEventListener("click", async () => {
	await orientation.lockOrientation("landscape");
});

orientation.unlockOrientation();
```

When `screen.orientation` or `lock()` is unavailable, `lockOrientation()`
returns a rejected promise. When `unlock()` is unavailable,
`unlockOrientation()` does nothing.

## Window Injection

```ts
const orientation = useScreenOrientation({
	window: null,
});
```

Passing `window: null` disables the browser global fallback for SSR and tests.
