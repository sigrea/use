---
category: Browser
---

# useUrlSearchParams

Reactive `URLSearchParams`.

## Usage

```ts
import { useUrlSearchParams } from "@sigrea/use";

const params = useUrlSearchParams("history");

params.foo = "bar";
params.vueuse = "awesome";
```

## Hash Mode

```ts
const params = useUrlSearchParams("hash");

params.foo = "bar";
```

Use `"hash-params"` when the hash itself should store query parameters.

```ts
const params = useUrlSearchParams("hash-params");

params.foo = "bar";
```

## Options

```ts
const params = useUrlSearchParams("history", {
	initialValue: { foo: "bar" },
	writeMode: "push",
	stringify: (params) => params.toString().replace(/=(&|$)/g, "$1"),
});
```

Set `write: false` to keep local param mutations from writing to browser
history. Browser `popstate` and `hashchange` events still update the returned
params.
