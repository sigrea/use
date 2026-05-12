---
category: Sensors
---

# useMouseInElement

Reactive mouse or touch position relative to an element.

## Usage

```ts
import { useMouseInElement } from "@sigrea/use";

const target = document.querySelector("#panel");
const {
	x,
	y,
	elementX,
	elementY,
	elementWidth,
	elementHeight,
	isOutside,
	stop,
} = useMouseInElement(target);

console.log(x.value, y.value);
console.log(elementX.value, elementY.value);
console.log(elementWidth.value, elementHeight.value);
console.log(isOutside.value);

stop();
```

## Options

```ts
import { useMouseInElement } from "@sigrea/use";

const state = useMouseInElement(document.body, {
	type: "client",
	handleOutside: false,
	windowScroll: false,
	windowResize: false,
});

console.log(state.elementX.value, state.elementY.value);
```

`type` is forwarded to `useMouse`. The default `"page"` adds the current window
scroll offset to element positions. Set `handleOutside: false` to keep the last
inside coordinates while the pointer is outside the target.
