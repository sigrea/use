# useDeviceOrientation

Reactive `DeviceOrientationEvent`. It updates readonly signals when the browser
fires `deviceorientation` events.

## Usage

```ts
import { useDeviceOrientation } from "@sigrea/use";

const {
	isAbsolute,
	alpha,
	beta,
	gamma,
	isSupported,
} = useDeviceOrientation();

if (isSupported.value) {
	alpha.value; // 0 to 360, or null
}
```

## Permissions

Some browsers expose `DeviceOrientationEvent.requestPermission()`. That method
must be called from a user action.

```ts
const orientation = useDeviceOrientation();

button.addEventListener("click", () => {
	void orientation.ensurePermissions();
});
```

Set `requestPermissions: true` only when you want to request permission during
setup. Browsers can reject that request when it is not triggered by a user
action, so interactive flows should prefer `ensurePermissions()`.

Pass `absolute: true` or call `ensurePermissions(true)` when the permission
request should include absolute orientation data. In that mode,
`useDeviceOrientation` listens to `deviceorientationabsolute`.

## State

| State | Description |
| --- | --- |
| `isAbsolute` | Whether the device is providing absolute orientation data. |
| `alpha` | Rotation around the z axis in degrees. |
| `beta` | Rotation around the x axis in degrees. |
| `gamma` | Rotation around the y axis in degrees. |
| `isSupported` | Whether the current window exposes `DeviceOrientationEvent`. |
| `requirePermissions` | Whether `DeviceOrientationEvent.requestPermission()` is available. |
| `permissionGranted` | Whether `ensurePermissions()` has obtained permission. |

`DeviceOrientationEvent` is only available in secure browser contexts in
browsers that implement the API. `requestPermission()` is experimental and not
available in every browser.
