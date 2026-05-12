---
category: Sensors
---

# useGeolocation

Reactive Geolocation API controls.

## Usage

```ts
import { useGeolocation } from "@sigrea/use";

const geolocation = useGeolocation();

console.log(geolocation.coords.value);
```

`coords` is `null` until the browser reports a position. When a position is
available, the coordinate values are copied into a plain readonly snapshot.
`locatedAt` stores the reported timestamp.

## Controls

```ts
const geolocation = useGeolocation({ immediate: false });

geolocation.resume();
geolocation.pause();
geolocation.stop();
```

`pause()` clears the active geolocation watch and keeps the last reported
position. `stop()` clears the watch and prevents later `resume()` calls.

## Options

```ts
useGeolocation({
	enableHighAccuracy: true,
	maximumAge: 30_000,
	timeout: 10_000,
});
```

The browser Geolocation API handles the default `PositionOptions` values when
they are omitted.

Pass `navigator: null` to avoid falling back to the global navigator in
server-side environments.
