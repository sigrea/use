# watchOnce

Watch a source and stop after the first callback run.

## Usage

```ts
import { signal } from "@sigrea/core";
import { watchOnce } from "@sigrea/use";

const source = signal(0);

const stop = watchOnce(
	source,
	(value) => {
		console.log(value);
	},
	{ flush: "sync" },
);

source.value = 1; // logs 1
source.value = 2; // ignored

stop();
```

`watchOnce` accepts the same options as Sigrea `watch`. Sigrea core does not
have Vue's `once` option, so this helper stops the watcher after the callback
runs for the first time. `immediate: true` is supported and stops the watcher
after the immediate callback.
