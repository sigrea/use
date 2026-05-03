---
category: Elements
---

# useElementSize

Reactive size of an element.

## Usage

```ts
import { useElementSize } from "@sigrea/use";

const element = document.querySelector("#panel");
const { width, height, stop } = useElementSize(element);

console.log(width.value, height.value);
stop();
```

## Options

```ts
import { useElementSize } from "@sigrea/use";

const size = useElementSize(
	element,
	{ width: 100, height: 100 },
	{ box: "border-box" },
);

console.log(size.width.value, size.height.value);
```

`box` defaults to `"content-box"` and also accepts `"border-box"` and
`"device-pixel-content-box"`.

When a target element is available, the initial value is read from
`offsetWidth` and `offsetHeight` before the first `ResizeObserver` callback.
SVG elements use `getBoundingClientRect()` instead.
