# watchWithFilter

Watch a source and pass each callback run through an event filter.

## Usage

```ts
import { signal } from "@sigrea/core";
import { watchWithFilter } from "@sigrea/use";

const source = signal(0);

const stop = watchWithFilter(
	source,
	(value) => {
		console.log(value);
	},
	{
		flush: "sync",
		eventFilter(invoke) {
			return invoke();
		},
	},
);

source.value = 1;
stop();
```

Without `eventFilter`, each watch callback run invokes the user callback
directly. The filter receives `invoke` and wrapper options
`{ fn, thisArg, args }`, and can choose when or whether to call `invoke`.

```ts
watchWithFilter(source, callback, {
	eventFilter(invoke, options) {
		console.log(options.args);
		return invoke();
	},
});
```

`watchWithFilter` accepts Sigrea `watch` options such as `deep`, `immediate`,
and `flush`. Source lists are supported, while a `DeepSignal` array is treated as
a single source.

## Cleanup

The callback return value is passed back to Sigrea `watch`, so returned cleanup
functions and `onCleanup` continue to work through the filter.
