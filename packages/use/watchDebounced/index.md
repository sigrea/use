# watchDebounced

Debounced watch. The callback runs after the watched source stops changing for
the configured delay.

## Usage

```ts
import { signal } from "@sigrea/core";
import { watchDebounced } from "@sigrea/use";

const source = signal("");

const stop = watchDebounced(
	source,
	(value) => {
		console.log(value);
	},
	{ debounce: 500 },
);

source.value = "search text";
// The callback runs after 500ms without more source changes.

// Later, stop the watcher when it is no longer needed.
stop();
```

## Options

`watchDebounced` accepts Sigrea `watch` options plus `debounce` and `maxWait`.

```ts
watchDebounced(source, callback, {
	debounce: 500,
	maxWait: 1000,
	flush: "sync",
});
```

`debounce` and `maxWait` can be raw values, signals, computed values, or
getters.

## Cleanup

The returned stop handle stops the watcher and cancels any pending debounced
callback.
