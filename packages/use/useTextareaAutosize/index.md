---
category: Browser
---

# useTextareaAutosize

Automatically update a textarea height from its content.

## Usage

```ts
import { useTextareaAutosize } from "@sigrea/use";

const { input, textarea } = useTextareaAutosize();

textarea.value = document.querySelector("textarea");
input.value = "Hello";
```

`triggerResize()` manually recalculates height from `scrollHeight`.

## Options

Use `maxHeight` to cap the autosized height in pixels.

```ts
const autosize = useTextareaAutosize({
	element: document.querySelector("textarea"),
	maxHeight: 180,
});
```

Use `styleProp: "minHeight"` when textarea rows should remain effective.

## Cleanup

`stop()` removes automatic input, resize, and watch handlers.
