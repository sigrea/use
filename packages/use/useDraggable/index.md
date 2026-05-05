# useDraggable

Make an element draggable with Pointer Events.

## Usage

```ts
import { useDraggable } from "@sigrea/use";

const draggable = useDraggable(element, {
	initialValue: { x: 40, y: 40 },
});

draggable.style.value; // "left: 40px; top: 40px;"
```

Use `style` with a positioned element, for example `position: fixed` or
`position: absolute`.

```ts
element.style.position = "fixed";
element.style.left = `${draggable.x.value}px`;
element.style.top = `${draggable.y.value}px`;
```

## Handles And Targets

Pass a handle when only part of the element should start dragging. Move and end
events listen on `draggingElement`, which defaults to `window`.

```ts
const draggable = useDraggable(panel, {
	handle: titleBar,
	draggingElement: document,
});
```

## Constraints

Use `axis` to limit movement and `containerElement` to keep the position within
the container scroll area.

```ts
const draggable = useDraggable(item, {
	axis: "x",
	containerElement: list,
});
```

## Event Filtering

`buttons` filters `PointerEvent.button`, and `pointerTypes` filters
`PointerEvent.pointerType`.

```ts
const draggable = useDraggable(item, {
	buttons: [0],
	pointerTypes: ["mouse", "touch"],
	preventDefault: true,
});
```

`onStart` can return `false` to cancel dragging.

```ts
useDraggable(item, {
	onStart(position, event) {
		if (event.altKey) {
			return false;
		}
	},
});
```

## State

| State | Description |
| --- | --- |
| `x` | Current x position. |
| `y` | Current y position. |
| `position` | Current `{ x, y }` position. |
| `isDragging` | Whether a pointer is currently dragging. |
| `style` | CSS `left` and `top` helper string. |

`stop()` removes listeners and clears the active drag state. Auto-scroll support
is not included in this initial implementation.
