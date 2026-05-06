---
category: Browser
---

# usePreferredColorScheme

Reactive preferred color scheme.

## Usage

```ts
import { usePreferredColorScheme } from "@sigrea/use";

const colorScheme = usePreferredColorScheme();

console.log(colorScheme.value);
```

## Server Side Rendering

```ts
import { usePreferredColorScheme } from "@sigrea/use";

const colorScheme = usePreferredColorScheme({
	window: null,
});
```

`usePreferredColorScheme` watches `(prefers-color-scheme: dark)` and
`(prefers-color-scheme: light)`. If the dark query does not match, it returns
`"light"`.
