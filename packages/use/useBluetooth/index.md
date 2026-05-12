# useBluetooth

Reactive Web Bluetooth controls. The API exposes readonly signals for support,
connection, selected device, GATT server, and the latest error.

## Usage

```ts
import { useBluetooth } from "@sigrea/use";

const bluetooth = useBluetooth({
	acceptAllDevices: true,
	optionalServices: ["battery_service"],
});

button.addEventListener("click", () => {
	void bluetooth.requestDevice();
});
```

`requestDevice()` must be called from a user action in browsers that require
transient activation.

## State

| State | Description |
| --- | --- |
| `isSupported` | Whether the current navigator exposes Web Bluetooth. |
| `isConnected` | Whether the selected device has a connected GATT server. |
| `device` | Selected Bluetooth device, when one has been granted. |
| `server` | Connected GATT server for the selected device. |
| `error` | Latest request or connection error. |

## Controls

```ts
await bluetooth.requestDevice();
await bluetooth.connect();
bluetooth.disconnect();
bluetooth.stop();
```

The Web Bluetooth API is experimental, has limited browser support, requires a
secure context, and is controlled by browser permission prompts.
