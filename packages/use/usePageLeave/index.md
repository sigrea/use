---
category: Browser
---

# usePageLeave

Reactive state that tracks whether the mouse pointer has left the page.

## Usage

```ts
import { usePageLeave } from "@sigrea/use";

const { isLeft, stop } = usePageLeave();

console.log(isLeft.value);

stop();
```

## Custom Window

```ts
import { usePageLeave } from "@sigrea/use";

const { isLeft, stop } = usePageLeave({
	window,
});

console.log(isLeft.value);
stop();
```
