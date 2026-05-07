---
category: Browser
---

# useWindowScroll

Reactive window scroll position and state.

## Usage

```ts
import { useWindowScroll } from "@sigrea/use";

const { x, y, scrollTo } = useWindowScroll();

console.log(x.value, y.value);

scrollTo({ top: 0 });
```

## Custom Window

```ts
import { useWindowScroll } from "@sigrea/use";

const { x, y, stop } = useWindowScroll({
	window,
});

console.log(x.value, y.value);
stop();
```

When `window` is unavailable, `x` and `y` are `0`.
