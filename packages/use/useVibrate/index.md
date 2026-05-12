# useVibrate

Reactive `Navigator.vibrate()` controls for simple tactile feedback.

## Usage

```ts
import { useVibrate } from "@sigrea/use";

const vibration = useVibrate({
	pattern: [300, 100, 300],
});

button.addEventListener("click", () => {
	vibration.vibrate();
});
```

`vibrate()` uses the current `pattern.value` when no pattern is passed. Passing
a pattern to `vibrate(pattern)` overrides the current signal value for that
call.

```ts
vibration.pattern.value = 200;
vibration.vibrate();
vibration.vibrate([50, 100, 50]);
```

## Repeating

Pass `interval` to create paused interval controls. Call `resume()` when the
vibration should repeat.

```ts
const vibration = useVibrate({
	interval: 1000,
	pattern: 200,
});

vibration.intervalControls?.resume();
```

Pass `scheduler` when a custom timing source should own repeat scheduling.

```ts
import { useIntervalFn, useVibrate } from "@sigrea/use";

const vibration = useVibrate({
	pattern: 200,
	scheduler: (callback) =>
		useIntervalFn(callback, 500, {
			immediate: false,
			immediateCallback: false,
		}),
});
```

## State

| State | Description |
| --- | --- |
| `isSupported` | Whether the current navigator exposes `vibrate()`. |
| `pattern` | Writable signal used by `vibrate()` when no argument is passed. |
| `intervalControls` | Pause/resume controls when `interval` or `scheduler` is provided. |

`stop()` calls `navigator.vibrate(0)` and pauses `intervalControls`.

## Custom Navigator

Pass `navigator` for tests, embedded environments, or SSR-aware setup.

```ts
const vibration = useVibrate({ navigator: window.navigator });

vibration.stop();
```
