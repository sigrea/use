---
category: Sensors
---

# onLongPress

Listen for a long press on an element.

## Usage

```ts
import { onLongPress } from "@sigrea/use";

const button = document.querySelector("button");

const stop = onLongPress(button, (event) => {
	console.log("long press", event.pointerType);
});

stop();
```

The handler runs after 500ms by default.

## Custom Delay

```ts
import { onLongPress } from "@sigrea/use";

onLongPress(target, handler, { delay: 1000 });

onLongPress(target, handler, {
	delay: (event) => (event.pointerType === "touch" ? 800 : 500),
});
```

## Distance Threshold

```ts
import { onLongPress } from "@sigrea/use";

onLongPress(target, handler, { distanceThreshold: 20 });
onLongPress(target, handler, { distanceThreshold: false });
```

The press is canceled when the pointer moves 10px or more by default. Set
`distanceThreshold` to `false` to disable movement cancellation.

## Release Callback

```ts
import { onLongPress } from "@sigrea/use";

onLongPress(target, handler, {
	onMouseUp(duration, distance, isLongPress, event) {
		console.log(duration, distance, isLongPress, event.pointerId);
	},
});
```

## Modifiers

```ts
import { onLongPress } from "@sigrea/use";

onLongPress(target, handler, {
	modifiers: {
		prevent: true,
		stop: true,
		self: true,
	},
});
```

Supported modifiers are `prevent`, `stop`, `self`, `capture`, and `once`.
