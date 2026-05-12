# watchPausable

Watch a source with pause and resume controls.

## Usage

```ts
import { signal } from "@sigrea/core";
import { watchPausable } from "@sigrea/use";

const source = signal(0);

const { pause, resume, stop } = watchPausable(
	source,
	(value) => {
		console.log(value);
	},
	{ flush: "sync" },
);

source.value = 1; // logs 1

pause();
source.value = 2; // ignored

resume();
source.value = 3; // logs 3

stop();
```

`watchPausable` accepts the same options as Sigrea `watch`, plus
`initialState?: "active" | "paused"`. It does not expose VueUse's
`eventFilter` option because Sigrea does not have `watchWithFilter` yet.

Paused updates keep the underlying watcher running. This means the next active
callback receives the latest value from the paused period as `oldValue`.
