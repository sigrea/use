---
category: State
related: useLocalStorage, useSessionStorage
---

# useStorage

Reactive storage-backed signal.

## Usage

```ts
import { useStorage } from "@sigrea/use";

const state = useStorage("settings", { theme: "light" }, localStorage);

state.value = { theme: "dark" };
state.value = null;
state.remove();
```

When the storage key does not exist, the default value is used and written to
storage by default.

## Merge Defaults

```ts
import { useStorage } from "@sigrea/use";

localStorage.setItem("settings", '{"theme":"dark"}');

const state = useStorage(
	"settings",
	{ theme: "light", compact: false },
	localStorage,
	{ mergeDefaults: true },
);

console.log(state.value?.compact); // false
```

`mergeDefaults: true` performs a shallow object merge. Pass a function when a
custom merge is needed.

## Custom Serialization

```ts
import { StorageSerializers, useStorage } from "@sigrea/use";

const storedMap = useStorage("cache", new Map(), localStorage, {
	serializer: StorageSerializers.map,
});
```

Built-in serializers are available for `string`, `number`, `boolean`, `object`,
`array`, `date`, `map`, `set`, and `any`.

## Options

```ts
useStorage("key", "default", localStorage, {
	listenToStorageChanges: true,
	writeDefaults: true,
	mergeDefaults: false,
	flush: "pre",
});
```
