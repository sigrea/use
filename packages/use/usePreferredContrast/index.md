---
category: Browser
---

# usePreferredContrast

Reactive preferred contrast.

## Usage

```ts
import { usePreferredContrast } from "@sigrea/use";

const contrast = usePreferredContrast();

console.log(contrast.value);
```

## Server Side Rendering

```ts
import { usePreferredContrast } from "@sigrea/use";

const contrast = usePreferredContrast({
	window: null,
});
```

`usePreferredContrast` watches `(prefers-contrast: more)`,
`(prefers-contrast: less)`, and `(prefers-contrast: custom)`. If none match,
it returns `"no-preference"`.
