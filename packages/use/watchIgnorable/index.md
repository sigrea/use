# watchIgnorable

Watch a source and expose helpers for ignoring selected source updates.

## Usage

```ts
import { signal } from "@sigrea/core";
import { watchIgnorable } from "@sigrea/use";

const source = signal("ready");

const { ignoreUpdates, stop } = watchIgnorable(
	source,
	(value) => {
		console.log(value);
	},
	{ flush: "sync" },
);

source.value = "logged";

ignoreUpdates(() => {
	source.value = "ignored";
});

// Later, stop the watcher when it is no longer needed.
stop();
```

`watchIgnorable` accepts the same options as Sigrea `watch`. It does not expose
VueUse's `eventFilter` option because Sigrea does not have `watchWithFilter` yet.

## Flush Timing

With `flush: "sync"`, updates are ignored only while the `ignoreUpdates`
callback is running. `ignorePrevAsyncUpdates()` is available but does nothing in
this mode.

With the default `flush: "pre"` or with `flush: "post"`, ignored synchronous
changes suppress the next scheduled watch callback. If another source change
happens before that scheduled callback runs, the latest value is reported.

```ts
const { ignorePrevAsyncUpdates } = watchIgnorable(source, (value) => {
	console.log(value);
});

source.value = "skip";
ignorePrevAsyncUpdates();
```
