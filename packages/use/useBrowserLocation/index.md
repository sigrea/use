# useBrowserLocation

Reactive browser location. It reads `window.location` and `window.history`, then
updates signals when the browser emits `popstate` or `hashchange`.

## Usage

```ts
import { useBrowserLocation } from "@sigrea/use";

const location = useBrowserLocation();

location.href.value;
location.pathname.value;
location.state.value;
```

## Writable Fields

`hash`, `host`, `hostname`, `href`, `pathname`, `port`, `protocol`, and `search`
are writable computed values. Assigning them writes to the current
`window.location` field when a window is available.

```ts
location.hash.value = "#details";
location.search.value = "?tab=activity";
```

## Custom Window

Pass a window-like target for tests, embedded environments, or SSR-aware setup.

```ts
const location = useBrowserLocation({ window: globalThis.window });

location.stop();
```
