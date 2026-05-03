---
category: Browser
---

# useOnline

Reactive online state from `navigator.onLine`.

## Usage

```ts
import { useOnline } from "@sigrea/use";

const { isOnline } = useOnline();

console.log(isOnline.value);
```

## Custom Targets

```ts
import { useOnline } from "@sigrea/use";

const { isOnline, stop } = useOnline({
	navigator: window.navigator,
	window,
});

console.log(isOnline.value);
stop();
```

When `navigator` is unavailable, the initial value is `true`.
