---
category: Elements
---

# useIntersectionObserver

Observe one or more elements with `IntersectionObserver`.

## Usage

```ts
import { signal, watch } from "@sigrea/core";
import { useIntersectionObserver } from "@sigrea/use";

const target = signal<HTMLElement | null>(null);
const visible = signal(false);

const observer = useIntersectionObserver(target, ([entry]) => {
	visible.value = entry?.isIntersecting ?? false;
});

watch(visible, (value) => {
	console.log(value);
});
```

## Controls

```ts
const observer = useIntersectionObserver(target, callback, {
	immediate: false,
	threshold: 0.5,
});

observer.resume();
observer.pause();
observer.stop();
```

`pause()` disconnects the current observer and keeps the instance resumable.
`stop()` disconnects the observer and disables future `resume()` calls.

## Window Injection

```ts
const observer = useIntersectionObserver(target, callback, {
	window: null,
});
```

Passing `window: null` disables the browser global fallback for SSR and tests.
