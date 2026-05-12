---
category: Animation
---

# useAnimate

Reactive Web Animations API controls for an element target.

## Usage

```ts
import { useAnimate } from "@sigrea/use";

const element = document.querySelector(".box");
const animation = useAnimate(
	element,
	{ transform: "rotate(360deg)" },
	{ duration: 1000 },
);

animation.pause();
animation.play();
```

Pass `immediate: false` to create the animation in a paused state.

```ts
const { play } = useAnimate(element, { opacity: [0, 1] }, {
	duration: 300,
	immediate: false,
});

play();
```

The returned controls expose readonly signals for animation state and writable
computed values for `currentTime`, `startTime`, `timeline`, and `playbackRate`.

```ts
const controls = useAnimate(element, [{ opacity: 0 }, { opacity: 1 }], 300);

controls.currentTime.value = 100;
controls.playbackRate.value = 2;
controls.stop();
```
