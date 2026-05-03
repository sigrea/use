---
category: Browser
---

# useEventListener

Use EventListener with ease.

## Usage

```ts
import { useEventListener } from "@sigrea/use";

useEventListener(document, "visibilitychange", (event) => {
	console.log(event);
});
```

## Default Target

When the target is omitted, it defaults to `window`:

```ts
import { useEventListener } from "@sigrea/use";

useEventListener("resize", () => {
	console.log("resize");
});
```

## Reactive Target

You can pass a signal or getter as the event target. The previous listener is
removed when the target changes.

```ts
import { signal } from "@sigrea/core";
import { useEventListener } from "@sigrea/use";

const target = signal<EventTarget | null>(window);

useEventListener(target, "keydown", (event) => {
	console.log(event);
});
```

## Multiple Events

You can pass an array of event names:

```ts
import { useEventListener } from "@sigrea/use";

useEventListener(document, ["mouseenter", "mouseleave"], (event) => {
	console.log(event.type);
});
```

## Multiple Targets

You can also pass an array of targets:

```ts
import { useEventListener } from "@sigrea/use";

const buttons = document.querySelectorAll("button");

useEventListener(Array.from(buttons), "click", () => {
	console.log("button clicked");
});
```

## Cleanup

Returns a stop handle to manually unregister the listener:

```ts
import { useEventListener } from "@sigrea/use";

const { stop } = useEventListener(document, "keydown", (event) => {
	console.log(event);
});

stop();
```
