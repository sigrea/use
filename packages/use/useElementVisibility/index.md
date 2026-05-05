# useElementVisibility

Tracks whether an element intersects the viewport or a configured root.

## Usage

```ts
import { useElementVisibility } from "@sigrea/use";

const visibility = useElementVisibility(element);

visibility.isVisible.value;
```

The state is updated by `IntersectionObserver`. `isSupported` reports whether
the configured window exposes that API.

## Initial Value

Use `initialValue` while the observer has not reported the first state.

```ts
const visibility = useElementVisibility(element, {
	initialValue: true,
});
```

## Root Options

Pass `root`, `rootMargin`, and `threshold` to control when the observer updates
the visibility state.

```ts
const visibility = useElementVisibility(element, {
	root: scrollContainer,
	rootMargin: "0px 0px 100px 0px",
	threshold: 0.5,
});
```

`root` follows the `IntersectionObserver` option name. It maps to the element or
document used as the viewport.

## Once

Use `once` to stop tracking after the first visibility change.

```ts
const visibility = useElementVisibility(element, {
	once: true,
});
```

`stop()` disconnects the observer and keeps the last visibility value.
