# @sigrea/use

Composable helpers for
[@sigrea/core](https://github.com/sigrea/core).

- state helpers: `useCounter()`, `useToggle()`
- timer helpers: `useTimeoutFn()`, `useIntervalFn()`
- browser helpers: `useEventListener()`, `useMediaQuery()`, `useWindowSize()`

## Install

```bash
npm install @sigrea/core @sigrea/use
```

`@sigrea/core` is a peer dependency.

Requires Node.js 20 or later.

## Usage

### State helpers

```ts
import { useCounter, useToggle } from "@sigrea/use";

const counter = useCounter(1, { min: 0, max: 10, step: 2 });

counter.inc();
counter.dec();
counter.reset();

const toggle = useToggle("off", {
  truthyValue: "on",
  falsyValue: "off",
});

toggle.toggle();
toggle.set("off");
```

`useCounter()` creates local state. `initialValue` can be a plain value,
signal, or getter, and it is read once when the helper is created.

`useToggle()` returns `{ value, toggle, set }`. `toggle()` switches between
`truthyValue` and `falsyValue`, and `toggle(nextValue)` sets the value
directly. Without `truthyValue` / `falsyValue`, `useToggle()` is boolean-only.
`initialValue` is read once when the helper is created. When you want custom
`truthyValue` / `falsyValue` without an explicit initial value, pass
`undefined` and it starts from `falsyValue`.

### Timer helpers

```ts
import { useIntervalFn, useTimeoutFn } from "@sigrea/use";

const timeout = useTimeoutFn(() => {
  console.log("done");
}, 500);

timeout.start();

const interval = useIntervalFn(() => {
  console.log("tick");
}, 1000, { immediate: true });

interval.pause();
interval.resume();
```

`useTimeoutFn()` returns `{ isPending, start, stop }`.
`useIntervalFn()` returns `{ isActive, pause, resume }`.

With `{ immediate: true }`, timers start on molecule mount during setup.
Outside molecules, they start right away.

- `useTimeoutFn()` resolves the current delay when `start()` runs
- `useIntervalFn()` resolves the current delay when `resume()` runs
- an active interval restarts when its delay changes
- an active interval stops when its delay becomes `0` or less
- `immediateCallback` runs the callback once before waiting

### Browser helpers

```ts
import { useEventListener, useMediaQuery, useWindowSize } from "@sigrea/use";

const resize = useEventListener("resize", () => {
  console.log("resize");
});

const mediaQuery = useMediaQuery("(min-width: 768px)", {
  initialValue: false,
});

const windowSize = useWindowSize({
  initialWidth: 0,
  initialHeight: 0,
});

console.log(mediaQuery.matches.value);
console.log(windowSize.width.value, windowSize.height.value);

resize.stop();
mediaQuery.stop();
windowSize.stop();
```

Browser helpers return a `stop()` handle.

#### useEventListener

```ts
import { signal } from "@sigrea/core";
import { useEventListener } from "@sigrea/use";

const eventName = signal("resize");

const listener = useEventListener(window, () => eventName.value, () => {
  console.log("window event changed");
});
```

- Returns `{ stop }`
- Defaults to `window` when the target is omitted
- Accepts plain values, signals, and getters for `target`, `type`, and
  `options`
- Copies `AddEventListenerOptions` for cleanup

Each `useEventListener()` call handles one target and one listener.

#### useMediaQuery

```ts
import { useMediaQuery } from "@sigrea/use";

const isLargeScreen = useMediaQuery("(min-width: 1024px)", {
  initialValue: false,
});
```

- Returns `{ matches, stop }`
- Accepts a plain query, signal, or getter
- Accepts a plain `window`, signal, or getter through `options.window`

If `window` is unavailable, `useMediaQuery()` uses `initialValue`.

#### useWindowSize

```ts
import { useWindowSize } from "@sigrea/use";

const { width, height, stop } = useWindowSize({
  initialWidth: 0,
  initialHeight: 0,
  type: "inner",
});
```

- Returns `{ width, height, stop }`
- Accepts a plain `window`, signal, or getter through `options.window`
- Supports `type: "inner" | "outer" | "visual"`
- Supports `includeScrollbar` and `listenOrientation`

If `window` is unavailable, `useWindowSize()` uses `initialWidth` and
`initialHeight`.

## SSR

Browser helpers can be imported even when `window` is unavailable.

- `useEventListener()` registers nothing when there is no target
- `useMediaQuery()` uses `initialValue` when no `window` is available
- `useWindowSize()` uses `initialWidth` and `initialHeight` when no `window` is
  available

## License

MIT
