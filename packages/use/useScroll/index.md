---
category: Sensors
---

# useScroll

Reactive scroll position and state.

## Usage

```ts
import { useScroll } from "@sigrea/use";

const scroll = useScroll(document);

console.log(scroll.x.value, scroll.y.value);
console.log(scroll.arrivedState.value);

scroll.stop();
```

`x` and `y` are writable computed values. Assigning to them scrolls the target.

```ts
const { x, y } = useScroll(element, { behavior: "smooth" });

x.value = 120;
y.value = 240;
```

You can also call `scrollTo()` directly.

```ts
const scroll = useScroll(element);

scroll.scrollTo({ left: 0, top: 400, behavior: "auto" });
```

## Scroll State

`isScrolling` becomes `true` when a scroll event is received. It returns to
`false` after `scrollend` or after the configured idle delay.

`arrivedState` reports whether the target is near the left, right, top, or
bottom edge. `directions` reports movement since the previous measurement.

```ts
const { arrivedState, directions, isScrolling } = useScroll(element, {
	offset: { bottom: 24 },
});
```

## Recalculate

Call `measure()` after layout or content changes that do not dispatch a scroll
event.

```ts
const { measure } = useScroll(element);

measure();
```

Set `observe: true` to recalculate after DOM mutations in the scroll element.

```ts
const scroll = useScroll(element, {
	observe: true,
});
```

## SSR

Pass `window: null` or a `null` target when no browser window is available. The
state stays at its initial values and no listeners are attached.
