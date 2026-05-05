# useElementByPoint

Reactive `document.elementFromPoint()` lookup for viewport-relative coordinates.

## Usage

```ts
import { useElementByPoint, useMouse } from "@sigrea/use";

const { x, y } = useMouse({ type: "client" });
const point = useElementByPoint({ x, y });

point.element.value;
```

`elementFromPoint()` and `elementsFromPoint()` use viewport coordinates, so pair
this with client mouse coordinates rather than page coordinates.

## Multiple Elements

Use `multiple: true` to read every element at the point, ordered from topmost to
bottommost.

```ts
const point = useElementByPoint({
	multiple: true,
	x,
	y,
});

point.element.value; // readonly Element[]
```

## Scheduling

By default, the point lookup runs with `requestAnimationFrame`.

```ts
const point = useElementByPoint({
	interval: 100,
	x,
	y,
});
```

Pass `scheduler` when the lookup should follow an existing scheduler. A scheduler
receives the update callback and returns `isActive`, `pause()`, and `resume()`
controls.

## State

| State | Description |
| --- | --- |
| `element` | The current element at the point, `null`, or a readonly array when `multiple` is true. |
| `isSupported` | Whether the current document exposes the required point lookup API. |
| `isActive` | Whether the scheduler is active. |

`pause()` stops scheduled lookup and keeps the last value. `resume()` starts it
again. `update()` performs one lookup without changing the scheduler state.
`stop()` stops the scheduler permanently.
