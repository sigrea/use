# useAsyncState

Reactive async state. It starts work without blocking the caller and updates
signals when the promise settles.

## Usage

```ts
import { useAsyncState } from "@sigrea/use";

const { state, isReady, isLoading, error } = useAsyncState(
	fetch("/api/todo/1").then((response) => response.json()),
	{ id: null },
);

state.value; // current data
isLoading.value; // true while pending
```

## Awaiting The Result

The return value is thenable, so it can be awaited until the current execution
finishes.

```ts
const { state, isReady } = await useAsyncState(fetchData, null);
```

## Manual Execution

Set `immediate: false` to prevent automatic execution on creation.

```ts
const { state, execute, executeImmediate } = useAsyncState(action, "", {
	immediate: false,
});

await executeImmediate("now");
await execute(500, "later");
```

## Options

```ts
const { state } = useAsyncState(fetchData, initialState, {
	immediate: true,
	delay: 0,
	resetOnExecute: true,
	shallow: true,
	throwError: false,
	onSuccess(data) {
		console.log("Success:", data);
	},
	onError(error) {
		console.error("Error:", error);
	},
});
```
