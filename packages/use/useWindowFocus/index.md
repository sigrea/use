---
category: Browser
---

# useWindowFocus

Reactive state that tracks whether the window has focus.

## Usage

```ts
import { useWindowFocus } from "@sigrea/use";

const { focused } = useWindowFocus();

console.log(focused.value);
```

## Custom Window

```ts
import { useWindowFocus } from "@sigrea/use";

const { focused, stop } = useWindowFocus({
	window,
});

console.log(focused.value);
stop();
```

When `window` is unavailable, the initial value is `false`.
