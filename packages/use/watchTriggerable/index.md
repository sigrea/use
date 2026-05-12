# watchTriggerable

Watch a source and expose a manual trigger.

## Usage

```ts
import { signal } from "@sigrea/core";
import { watchTriggerable } from "@sigrea/use";

const source = signal(0);

const { trigger, ignoreUpdates, stop } = watchTriggerable(
	source,
	(value) => {
		console.log(value);
		return value;
	},
);

source.value = 1;

const value = trigger();
// value is 1

ignoreUpdates(() => {
	source.value = 2;
});

stop();
```

`trigger()` runs the callback immediately with the current source value. The
manual old value is `undefined` for a single source, or an array of `undefined`
for a source list.

`trigger()` returns the user callback's return value. After `stop()` it does not
run the callback and returns `undefined`.

## Cleanup

Use the `onCleanup` argument to register cleanup work. The previous cleanup runs
before the next callback and when `stop()` is called.

```ts
watchTriggerable(source, async (value, _oldValue, onCleanup) => {
	let cancelled = false;
	onCleanup(() => {
		cancelled = true;
	});

	await load(value);
	if (cancelled) {
		return;
	}
});
```

Callback return values are not treated as cleanup for watched source changes.
This keeps `trigger()` return values separate from Sigrea `watch` cleanup.
