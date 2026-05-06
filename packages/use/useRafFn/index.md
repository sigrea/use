---
category: Animation
---

# useRafFn

Run a callback on `requestAnimationFrame` with pause and resume controls.

## Usage

```ts
import { useRafFn } from "@sigrea/use";

const { isActive, pause, resume } = useRafFn(({ delta, timestamp }) => {
	console.log(delta, timestamp);
});

console.log(isActive.value);

pause();
resume();
```

## Frame Rate Limit

```ts
import { signal } from "@sigrea/core";
import { useRafFn } from "@sigrea/use";

const fpsLimit = signal<number | null>(30);

useRafFn(
	({ delta }) => {
		console.log(delta);
	},
	{ fpsLimit },
);
```

`fpsLimit: null` disables the limit. Unsafe values such as `0`, `NaN`, or
negative numbers are also treated as unlimited.

## Server Side Rendering

```ts
import { useRafFn } from "@sigrea/use";

const controls = useRafFn(() => {}, {
	window: null,
});
```

When `window` is `null` or `requestAnimationFrame` is unavailable, the loop does
not start and `isActive` stays `false`.
