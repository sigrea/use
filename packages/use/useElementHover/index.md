# useElementHover

Reactive hover state for an element.

## Usage

```ts
import { useElementHover } from "@sigrea/use";

const hover = useElementHover(element);

hover.isHovered.value;
```

The state follows `mouseenter` and `mouseleave` events. These events do not
bubble and are based on the DOM tree relationship of the element.

## Delays

Use `delayEnter` and `delayLeave` to defer state changes.

```ts
const hover = useElementHover(element, {
	delayEnter: 100,
	delayLeave: 200,
});
```

When the opposite event fires before the delay finishes, the pending change is
cancelled.

## Removal

Use `triggerOnRemoval` when the hover state should reset if the element is
removed from the document.

```ts
const hover = useElementHover(element, {
	triggerOnRemoval: true,
});
```

Pass `document` when the target is observed from a detached root or shadow root.

```ts
const hover = useElementHover(element, {
	document: root,
	triggerOnRemoval: true,
});
```

`stop()` removes listeners, cancels pending timers, stops removal tracking, and
resets the hover state.
