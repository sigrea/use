---
category: Animation
---

# useInterval

Reactive counter that increases on every interval.

## Usage

```ts
import { useInterval } from "@sigrea/use";

const counter = useInterval(200);

console.log(counter.value); // 0
```

## With Controls

```ts
import { useInterval } from "@sigrea/use";

const { counter, reset, pause, resume, isActive } = useInterval(200, {
	controls: true,
});

pause();
resume();
reset();

console.log(counter.value);
console.log(isActive.value);
```

Use `callback` to receive the incremented count on every interval.

```ts
useInterval(1000, {
	callback: (count) => {
		console.log(count);
	},
});
```
