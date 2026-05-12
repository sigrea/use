---
category: Sensors
---

# useParallax

Reactive parallax values from device orientation, with mouse position fallback.

## Usage

```ts
import { useParallax } from "@sigrea/use";

const target = document.querySelector("#card");
const { roll, tilt, source, stop } = useParallax(target);

console.log(roll.value);
console.log(tilt.value);
console.log(source.value);

stop();
```

## Permissions

Some browsers require `DeviceOrientationEvent.requestPermission()` before
device orientation values are available. Call `ensurePermissions()` from a user
action.

```ts
import { useParallax } from "@sigrea/use";

const parallax = useParallax(document.body);

button.addEventListener("click", () => {
	void parallax.ensurePermissions();
});
```

Set `requestPermissions: true` only when you want to request permission during
setup. Browsers can reject that request when it is not triggered by a user
action, so interactive flows should prefer `ensurePermissions()`.

Pass `absolute: true` or call `ensurePermissions(true)` when the permission
request should include absolute orientation data.

## Adjust Values

```ts
import { useParallax } from "@sigrea/use";

const parallax = useParallax(document.body, {
	mouseTiltAdjust: (value) => value * 20,
	mouseRollAdjust: (value) => value * 20,
	deviceOrientationTiltAdjust: (value) => value * 15,
	deviceOrientationRollAdjust: (value) => value * 15,
});

console.log(parallax.source.value);
parallax.stop();
```
