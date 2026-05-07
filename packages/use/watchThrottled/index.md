# watchThrottled

Throttled watch. The callback runs at most once per configured interval.

## Usage

```ts
import { signal } from "@sigrea/core";
import { watchThrottled } from "@sigrea/use";

const source = signal("");

const stop = watchThrottled(
	source,
	(value) => {
		console.log(value);
	},
	{ throttle: 500, flush: "sync" },
);

source.value = "search text";

stop();
```

## Options

`watchThrottled` accepts Sigrea `watch` options plus `throttle`, `trailing`,
and `leading`.

```ts
watchThrottled(source, callback, {
	throttle: 500,
	trailing: true,
	leading: true,
	flush: "sync",
});
```

`throttle` can be a raw value, signal, computed value, or getter. Its default is
`0`. `trailing` and `leading` both default to `true`, matching VueUse.

`watchThrottled` does not expose VueUse's `eventFilter` option because Sigrea
does not have `watchWithFilter` yet.

## Cleanup

The returned stop handle stops the watcher and cancels any pending trailing
callback.
