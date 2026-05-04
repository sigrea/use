---
category: Reactivity
---

# tryOnScopeDispose

Registers cleanup in the current Sigrea scope when one is active.

## Usage

```ts
import { tryOnScopeDispose } from "@sigrea/use";

const registered = tryOnScopeDispose(() => {
	// cleanup
});

console.log(registered); // false when called outside a scope
```

`tryOnScopeDispose()` returns `true` when the cleanup was registered. When no
scope is active, it returns `false` and does not run the cleanup.
