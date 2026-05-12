---
category: Browser
---

# usePreferredReducedTransparency

Reactive preferred reduced transparency.

## Usage

```ts
import { usePreferredReducedTransparency } from "@sigrea/use";

const transparency = usePreferredReducedTransparency();

console.log(transparency.value);
```

## Server Side Rendering

```ts
import { usePreferredReducedTransparency } from "@sigrea/use";

const transparency = usePreferredReducedTransparency({
	window: null,
});
```

`usePreferredReducedTransparency` watches
`(prefers-reduced-transparency: reduce)`. If the query does not match, it
returns `"no-preference"`.
