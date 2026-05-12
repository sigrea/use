---
category: Browser
---

# useCssSupports

Reactive [`CSS.supports`](https://developer.mozilla.org/en-US/docs/Web/API/CSS/supports_static).

## Usage

```ts
import { useCssSupports } from "@sigrea/use";

const isGridSupported = useCssSupports("display", "grid");
const isFlexSupported = useCssSupports("display: flex");

if (isGridSupported.value) {
	console.log("CSS grid is supported");
}
```

`useCssSupports` returns a readonly signal. It accepts either a CSS property and
value pair or a full `@supports` condition string.

## Options

```ts
import { useCssSupports } from "@sigrea/use";

const isSupported = useCssSupports("display: grid", {
	initialValue: false,
	window,
});
```

`initialValue` is used when no `window.CSS.supports` implementation is
available, such as during SSR.
