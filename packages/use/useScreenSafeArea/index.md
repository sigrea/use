---
category: Browser
---

# useScreenSafeArea

Reactive `env(safe-area-inset-*)` values.

## Usage

```ts
import { useScreenSafeArea } from "@sigrea/use";

const safeArea = useScreenSafeArea();

console.log(safeArea.top.value);
console.log(safeArea.right.value);
console.log(safeArea.bottom.value);
console.log(safeArea.left.value);
```

`useScreenSafeArea` writes Sigrea CSS custom properties to
`document.documentElement`, then reads their computed values:

- `--sigrea-safe-area-top`
- `--sigrea-safe-area-right`
- `--sigrea-safe-area-bottom`
- `--sigrea-safe-area-left`

The properties use `env(safe-area-inset-*, 0px)` so browsers that support CSS
environment variables can resolve the safe-area inset values.

## Updating

```ts
const safeArea = useScreenSafeArea();

safeArea.update();
```

The values update on `resize`, `orientationchange`, and `visualViewport`
`resize` when available. Call `update()` to read the current computed values
manually.

## Window Injection

```ts
const safeArea = useScreenSafeArea({
	window: null,
});
```

Passing `window: null` disables the browser global fallback for SSR and tests.
When `window`, `document`, `documentElement`, or `getComputedStyle` is
unavailable, all inset values are empty strings.
