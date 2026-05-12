# watchDeep

Watch a source with `deep: true`.

## Usage

```ts
import { deepSignal } from "@sigrea/core";
import { watchDeep } from "@sigrea/use";

const source = deepSignal({ nested: { count: 0 } });

const stop = watchDeep(
	source,
	(value) => {
		console.log(value.nested.count);
	},
	{ flush: "sync" },
);

source.nested.count = 1;

// Later, stop the watcher when it is no longer needed.
stop();
```

`watchDeep` accepts the same options as Sigrea `watch`, except `deep`. The
helper always watches deeply. Pass a Sigrea watch source, such as a signal,
getter, or deep signal; plain objects are not watched by Sigrea core.
