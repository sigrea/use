---
category: Animation
---

# useTransition

Transition between values.

## Usage

```ts
import { signal } from "@sigrea/core";
import { TransitionPresets, useTransition } from "@sigrea/use";

const source = signal(0);
const output = useTransition(source, {
	duration: 1000,
	easing: TransitionPresets.easeInOutCubic,
});
```

When `source` changes, `output` follows it over the configured duration. If the
source changes during an active transition, the next transition starts from the
current output value.

## Easing

```ts
useTransition(source, {
	easing: [0.75, 0, 0.25, 1],
});
```

`TransitionPresets` includes common cubic bezier presets and `linear`. A custom
function can be passed for more complex easing.

## Custom Interpolation

By default, the source must resolve to a number or an array of numbers. For other
values, pass an interpolation function.

```ts
const word = signal("Hello");
const output = useTransition(word, {
	interpolation: (from, to, alpha) => (alpha < 0.5 ? from : to),
});
```

## Delay And Callbacks

```ts
useTransition(source, {
	delay: 1000,
	onStarted() {},
	onFinished() {},
});
```

Set `disabled` to make the output track the source synchronously. Disabled
transitions do not wait for `delay` and do not call transition callbacks.

## Manual Transition

```ts
import { signal } from "@sigrea/core";
import { transition } from "@sigrea/use";

const source = signal(0);

await transition(source, 0, 1, {
	duration: 1000,
	abort: () => false,
});
```
