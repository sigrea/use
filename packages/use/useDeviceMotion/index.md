# useDeviceMotion

Reactive `DeviceMotionEvent`. It updates readonly signals when the browser
fires `devicemotion` events.

## Usage

```ts
import { useDeviceMotion } from "@sigrea/use";

const {
	acceleration,
	accelerationIncludingGravity,
	rotationRate,
	interval,
	isSupported,
} = useDeviceMotion();

if (isSupported.value) {
	acceleration.value; // { x, y, z }
}
```

## Permissions

Some browsers expose `DeviceMotionEvent.requestPermission()`. That method must
be called from a user action.

```ts
const motion = useDeviceMotion();

button.addEventListener("click", () => {
	void motion.ensurePermissions();
});
```

Set `requestPermissions: true` only when you want to request permission during
setup. Browsers can reject that request when it is not triggered by a user
action, so interactive flows should prefer `ensurePermissions()`.

## State

| State | Description |
| --- | --- |
| `acceleration` | Acceleration on the x, y, and z axes, without gravity when available. |
| `accelerationIncludingGravity` | Acceleration on the x, y, and z axes including gravity. |
| `rotationRate` | Rotation rate around alpha, beta, and gamma axes. |
| `interval` | Sampling interval in milliseconds. |
| `isSupported` | Whether the current window exposes `DeviceMotionEvent`. |
| `requirePermissions` | Whether `DeviceMotionEvent.requestPermission()` is available. |
| `permissionGranted` | Whether `ensurePermissions()` has obtained permission. |

`DeviceMotionEvent` is only available in secure browser contexts in browsers
that implement the API. `requestPermission()` is experimental and not available
in every browser.
