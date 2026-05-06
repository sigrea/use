# useMemoize

Cache function results by arguments. Repeated calls with the same key return
the cached result until you call `load`, `delete`, or `clear`.

```ts
import { useMemoize } from "@sigrea/use";

const getUser = useMemoize(async (id: number) => {
	const response = await fetch(`/users/${id}`);
	return response.json();
});

const user = await getUser(1);
const sameUser = await getUser(1);
```

Use `load` to run the resolver again and replace the cached value.

```ts
await getUser.load(1);
```

Use `delete` and `clear` to remove cached entries.

```ts
getUser.delete(1);
getUser.clear();
```

The default key is `JSON.stringify(args)`. Provide `getKey` when the arguments
are large, cyclic, or include values that should not affect caching.

```ts
const getUser = useMemoize(
	async (id: number, headers: HeadersInit) => {
		const response = await fetch(`/users/${id}`, { headers });
		return response.json();
	},
	{
		getKey: (id) => id,
	},
);
```

The exposed `cache` is reactive for Sigrea readers. A computed value that calls
the memoized function is refreshed when `load` or the exposed cache mutators
change cached values.

```ts
import { computed } from "@sigrea/core";

const user = computed(() => getUser(1));

await getUser.load(1);
user.value;
```

Results are not cleared automatically. Call `clear()` when cached data is no
longer needed, or pass a custom cache with its own eviction policy.
