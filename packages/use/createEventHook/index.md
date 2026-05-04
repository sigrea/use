---
category: Utilities
---

# createEventHook

Utility for creating event hooks.

## Usage

```ts
import { createEventHook } from "@sigrea/use";

export function useMyFetch(url: string) {
	const fetchResult = createEventHook<Response>();
	const fetchError = createEventHook<string>();

	fetch(url)
		.then((result) => fetchResult.trigger(result))
		.catch((error) => fetchError.trigger(String(error)));

	return {
		onResult: fetchResult.on,
		onError: fetchError.on,
	};
}
```

```ts
const { onResult, onError } = useMyFetch("/api/data");

onResult((result) => {
	console.log(result);
});

onError((error) => {
	console.error(error);
});
```

`on()` returns an `off()` handle. `off(fn)` removes one listener, and `clear()`
removes all listeners.

```ts
const hook = createEventHook<number>();
const listener = (value: number) => {
	console.log(value);
};

const { off } = hook.on(listener);

await hook.trigger(1);

off();
await hook.trigger(2);
```

When a listener is registered inside a Sigrea scope, it is removed when that
scope is disposed.
