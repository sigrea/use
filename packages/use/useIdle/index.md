---
category: Sensors
---

# useIdle

Tracks whether the user has been inactive.

## Usage

```ts
import { useIdle } from "@sigrea/use";

const idle = useIdle(5 * 60 * 1000);

console.log(idle.idle.value);
```

`idle` becomes `true` after the timeout passes without activity. Activity
updates `lastActive` and restarts the timer.

## Controls

```ts
const idle = useIdle(60_000, { initialState: true });

idle.stop();
idle.start();
idle.reset();
```

`stop()` removes the activity listeners and clears the current timer. `start()`
adds them again. `reset()` marks the user as active and restarts the timer while
tracking is active.

## Options

```ts
useIdle(60_000, {
	events: ["mousemove", "keydown"],
	listenForVisibilityChange: false,
});
```

By default, activity is detected from mouse, keyboard, touch, wheel, and resize
events. When visibility listening is enabled, returning to a visible document is
also treated as activity.

Pass `window: null` to avoid falling back to the global window in server-side
environments.
