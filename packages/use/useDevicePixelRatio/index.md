---
category: Browser
---

# useDevicePixelRatio

Reactive `window.devicePixelRatio`.

`devicePixelRatio` does not have a dedicated change event. This composable
watches the current `(resolution: <ratio>dppx)` media query and re-arms that
query whenever the ratio changes.

## Usage

```ts
import { useDevicePixelRatio } from "@sigrea/use";

const { pixelRatio } = useDevicePixelRatio();

console.log(pixelRatio.value);
```

## Fallback

When `window` is unavailable, `pixelRatio` uses `1` by default.

```ts
import { useDevicePixelRatio } from "@sigrea/use";

const { pixelRatio } = useDevicePixelRatio({
	initialValue: 2,
	window: null,
});
```
