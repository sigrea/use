---
category: Sensors
---

# useMouse

Reactive mouse or touch position.

## Usage

```ts
import { useMouse } from "@sigrea/use";

const { x, y, sourceType, stop } = useMouse();

console.log(x.value, y.value, sourceType.value);
stop();
```

## Options

```ts
import { useMouse } from "@sigrea/use";

const mouse = useMouse({
	type: "client",
	touch: false,
	initialValue: { x: 10, y: 10 },
});

console.log(mouse.x.value, mouse.y.value);
```

`type` supports `"page"`, `"client"`, `"screen"`, and `"movement"`. Page
coordinates follow window scroll by default. Set `scroll: false` to keep the
last page position unchanged while scrolling.
