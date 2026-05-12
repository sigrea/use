---
category: Time
related: useIntervalFn
---

# useCountdown

Reactive countdown timer.

## Usage

```ts
import { useCountdown } from "@sigrea/use";

const countdown = useCountdown(5, {
	interval: 1000,
	onTick(remaining) {
		console.log(remaining);
	},
	onComplete() {
		console.log("done");
	},
});

countdown.start();
countdown.pause();
countdown.resume();
countdown.stop();
```

`remaining` is a readonly signal. The countdown starts paused unless
`immediate: true` is set.

## Reset

```ts
import { signal } from "@sigrea/core";
import { useCountdown } from "@sigrea/use";

const initial = signal(5);
const countdown = useCountdown(initial);

initial.value = 10;

countdown.start(); // starts from 10
countdown.reset(4); // updates remaining without starting
countdown.start(2); // starts from 2
```

`pause()` keeps the current remaining value. `stop()` pauses and resets to the
latest initial value.

## Scheduler

```ts
import { useCountdown, useIntervalFn } from "@sigrea/use";

const countdown = useCountdown(5, {
	scheduler(callback) {
		return useIntervalFn(callback, 500, { immediate: false });
	},
});
```

`interval` and `immediate` are used only by the default scheduler. When
`scheduler` is provided, it owns the tick interval and the initial active state.
