---
category: Browser
---

# useMediaQuery

Reactive media query.

## Usage

```ts
import { useMediaQuery } from "@sigrea/use";

const isLargeScreen = useMediaQuery("(min-width: 1024px)");
const isPreferredDark = useMediaQuery("(prefers-color-scheme: dark)");

console.log(isLargeScreen.matches.value);
```

## Server Side Rendering

If you use `useMediaQuery` with SSR, specify the screen size to render before
hydration:

```ts
import { useMediaQuery } from "@sigrea/use";

const isLargeScreen = useMediaQuery("(min-width: 1024px)", {
	ssrWidth: 768,
});
```

When `matchMedia` is unavailable, `ssrWidth` estimates `px` and `rem`
`min-width` / `max-width` queries. Other media features are ignored for this
estimate.

## Initial Value

If no browser or SSR width result is available, `initialValue` is used.

```ts
import { useMediaQuery } from "@sigrea/use";

const isLargeScreen = useMediaQuery("(min-width: 1024px)", {
	initialValue: false,
});
```
