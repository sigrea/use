---
category: State
related: useStorage, useLocalStorage, useSessionStorage
---

# useStorageAsync

Reactive storage-backed signal for async storage APIs.

## Usage

```ts
import { useStorageAsync } from "@sigrea/use";

const state = useStorageAsync("settings", { theme: "light" }, storage);

console.log(state.value); // default value before the first read finishes

await state;

console.log(state.value); // stored value after the first read attempt
```

`useStorageAsync` has the same overloads as `useStorage`. It returns a
removable signal that can also be awaited. `onReady` is called after the first
read attempt finishes.

```ts
const state = useStorageAsync("settings", { theme: "light" }, storage, {
	onReady(value) {
		console.log(value);
	},
});
```

## Writes And Removal

```ts
state.value = { theme: "dark" };
state.value = null;
state.remove();
```

Assigning `null` or calling `remove()` removes the storage item. `stop()` stops
the signal watcher and storage event listener.

## Options

```ts
useStorageAsync("key", "default", storage, {
	listenToStorageChanges: true,
	writeDefaults: true,
	mergeDefaults: false,
	flush: "pre",
});
```

`writeDefaults`, `mergeDefaults`, `deep`, `shallow`, `flush`,
`initOnMounted`, `listenToStorageChanges`, `window`, and `onError` follow
`useStorage` behavior.

## Custom Serialization

```ts
const state = useStorageAsync("count", 0, storage, {
	serializer: {
		async read(raw) {
			return Number(raw);
		},
		async write(value) {
			return String(value);
		},
	},
});
```

Synchronous storage and serializers are also accepted.
