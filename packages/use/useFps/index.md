---
category: Sensors
---

# useFps

Reactive frames-per-second estimate.

## Usage

```ts
import { useFps } from "@sigrea/use";

const fps = useFps();

console.log(fps.value);
```

## Options

`every` controls how many animation frames are sampled before updating. It
defaults to `10`.

```ts
import { useFps } from "@sigrea/use";

const fps = useFps({ every: 5 });
```

When `requestAnimationFrame` or `performance.now()` is unavailable, the value
stays `0`.
