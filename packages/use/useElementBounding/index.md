# useElementBounding

Reactive `getBoundingClientRect()` values for an element.

## Usage

```ts
import { useElementBounding } from "@sigrea/use";

const bounds = useElementBounding(element);

bounds.width.value;
bounds.height.value;
bounds.top.value;
```

The values are relative to the viewport. They can change when the page scrolls,
when the window resizes, when the element size changes, or when the element
class/style changes.

## Options

```ts
const bounds = useElementBounding(element, {
	reset: true,
	windowResize: true,
	windowScroll: true,
	immediate: true,
	updateTiming: "sync",
});
```

Use `updateTiming: "next-frame"` when the layout change that affects the
element is expected to settle on the next animation frame.

`windowResize` and `windowScroll` control window event listeners. `reset` clears
all values to `0` when the target cannot be resolved.

## State

| State | Description |
| --- | --- |
| `width` | Element bounding width. |
| `height` | Element bounding height. |
| `top` | Distance from the viewport top. |
| `right` | Distance from the viewport left to the right edge. |
| `bottom` | Distance from the viewport top to the bottom edge. |
| `left` | Distance from the viewport left. |
| `x` | Same coordinate space as `left`. |
| `y` | Same coordinate space as `top`. |

`update()` reads the current bounding rectangle. `stop()` removes observers,
window listeners, and any pending animation frame.
