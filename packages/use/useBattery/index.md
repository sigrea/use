# useBattery

Reactive Battery Status API. It reads the current battery state from
`navigator.getBattery()` and updates signals when the browser reports battery
events.

## Usage

```ts
import { useBattery } from "@sigrea/use";

const { isSupported, charging, chargingTime, dischargingTime, level } =
	useBattery();

if (isSupported.value) {
	level.value; // number between 0 and 1
}
```

## State

| State | Description |
| --- | --- |
| `isSupported` | Whether the current navigator exposes the Battery Status API. |
| `charging` | Whether the device is currently charging. |
| `chargingTime` | Seconds until the device becomes fully charged. |
| `dischargingTime` | Seconds before the device becomes fully discharged. |
| `level` | Current charge level from `0` to `1`. |

## Custom Navigator

Pass a navigator-like object for tests, embedded environments, or SSR-aware
setup.

```ts
const battery = useBattery({ navigator: window.navigator });

battery.stop();
```

The Battery Status API has limited browser support and is only available in
secure browser contexts where the browser exposes it.
