# watchAtMost

Watch a source and run the callback only up to the configured count.

## Usage

```ts
import { signal } from "@sigrea/core";
import { watchAtMost } from "@sigrea/use";

const source = signal(0);

const { count, stop } = watchAtMost(
	source,
	(value) => {
		console.log(value);
	},
	{ count: 3, flush: "sync" },
);

source.value = 1;
source.value = 2;
source.value = 3;
source.value = 4; // ignored

console.log(count.value); // 3
stop();
```

`count` is a readonly signal that records how many times the callback ran.

## Watch Options

`watchAtMost` accepts the same watch options as Sigrea `watch`, plus a required
`count` option. Use `flush: "sync"` when the callback must run immediately.
`count` values at or below `0`, and `NaN`, prevent the callback from running.
Finite decimal values are rounded down. `Infinity` keeps watching until
`stop()` is called.

```ts
watchAtMost(source, callback, {
	count: 1,
	flush: "sync",
	immediate: true,
});
```

Call `stop()` to end the watcher before the limit is reached.
