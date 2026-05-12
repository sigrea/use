# watchImmediate

Watch a source with `immediate: true`.

## Usage

```ts
import { signal } from "@sigrea/core";
import { watchImmediate } from "@sigrea/use";

const source = signal("ready");

const stop = watchImmediate(source, (value) => {
	console.log(value);
});

source.value = "updated";

// Later, stop the watcher when it is no longer needed.
stop();
```

`watchImmediate` accepts the same options as Sigrea `watch`, except
`immediate`. The helper always runs the callback immediately and returns the
Sigrea `WatchStopHandle`.
