---
category: Sensors
---

# useMousePressed

Reactive mouse, touch, and drag pressing state.

## Usage

```ts
import { useMousePressed } from "@sigrea/use";

const { pressed, sourceType, stop } = useMousePressed();

console.log(pressed.value, sourceType.value);
stop();
```

## Target

```ts
import { useMousePressed } from "@sigrea/use";

const button = document.querySelector("button");
const state = useMousePressed({ target: button });

console.log(state.pressed.value);
```

`target` limits press events such as `mousedown`, `touchstart`, and `dragstart`.
Release events are still listened on the window.

## Options

```ts
import { useMousePressed } from "@sigrea/use";

const state = useMousePressed({
	capture: true,
	drag: false,
	touch: false,
	onPressed(event) {
		console.log(event.type);
	},
	onReleased(event) {
		console.log(event.type);
	},
});

console.log(state.sourceType.value);
```
