---
category: Elements
---

# useResizeObserver

Observe size changes for one or more elements with `ResizeObserver`.

## Usage

```ts
import { useResizeObserver } from "@sigrea/use";

const target = document.querySelector("#panel");

const observer = useResizeObserver(target, (entries) => {
	for (const entry of entries) {
		console.log(entry.target, entry.contentRect.width);
	}
});

console.log(observer.isSupported.value);
observer.stop();
```

## Box

```ts
const observer = useResizeObserver(target, callback, {
	box: "border-box",
});
```

`box` defaults to the browser `ResizeObserver` default and also accepts
`"content-box"`, `"border-box"`, and `"device-pixel-content-box"`.

## Window Injection

```ts
const observer = useResizeObserver(target, callback, {
	window: null,
});
```

Passing `window: null` disables the browser global fallback for SSR and tests.
