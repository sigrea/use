# whenever

Watch a source and run the callback only when the value is truthy.

## Usage

```ts
import { signal } from "@sigrea/core";
import { whenever } from "@sigrea/use";

const ready = signal(false);

const stop = whenever(
	ready,
	() => {
		console.log("ready");
	},
	{ flush: "sync" },
);

ready.value = true;
stop();
```

`whenever` accepts a single Sigrea `watch` source and its options, plus `once`
to stop after the first truthy callback run.

```ts
whenever(
	() => counter.value === 7,
	() => {
		console.log("counter is 7");
	},
	{ once: true },
);
```

The callback receives the truthy value, the previous source value, and
`onCleanup`. Falsy changes still update the previous value tracked by the
underlying watch.
