---
category: Browser
---

# usePreferredReducedMotion

Reactive preferred reduced motion.

## Usage

```ts
import { usePreferredReducedMotion } from "@sigrea/use";

const motion = usePreferredReducedMotion();

console.log(motion.value);
```

## Server Side Rendering

```ts
import { usePreferredReducedMotion } from "@sigrea/use";

const motion = usePreferredReducedMotion({
	window: null,
});
```

`usePreferredReducedMotion` watches `(prefers-reduced-motion: reduce)`. If the
query does not match, it returns `"no-preference"`.
