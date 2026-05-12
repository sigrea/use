# useDevicesList

Reactive `MediaDevices.enumerateDevices()` list for cameras, microphones, and
audio outputs.

## Usage

```ts
import { useDevicesList } from "@sigrea/use";

const {
	devices,
	videoInputs,
	audioInputs,
	audioOutputs,
	isSupported,
} = useDevicesList();

if (isSupported.value) {
	videoInputs.value; // cameras
	audioInputs.value; // microphones
	audioOutputs.value; // speakers
	devices.value; // all reported devices
}
```

## Permissions

Browsers can hide device labels and non-default device IDs until the user grants
camera or microphone access. Call `ensurePermissions()` from a user action when
your UI needs the full list.

```ts
const devices = useDevicesList();

button.addEventListener("click", async () => {
	const granted = await devices.ensurePermissions();

	if (granted) {
		devices.videoInputs.value;
	}
});
```

Set `requestPermissions: true` only when requesting access during setup is
intentional. Many browsers require the permission prompt to start from a user
action.

`constraints` controls the media permissions requested by `getUserMedia()`.
The default requests both audio and video.

```ts
const microphones = useDevicesList({
	constraints: { audio: true, video: false },
});
```

## State

| State | Description |
| --- | --- |
| `devices` | Devices returned by `navigator.mediaDevices.enumerateDevices()`. |
| `videoInputs` | Devices whose `kind` is `videoinput`. |
| `audioInputs` | Devices whose `kind` is `audioinput`. |
| `audioOutputs` | Devices whose `kind` is `audiooutput`. |
| `isSupported` | Whether the current navigator exposes `mediaDevices.enumerateDevices()`. |
| `permissionGranted` | Whether `ensurePermissions()` has obtained the requested camera or microphone permission. |

## Custom Navigator

Pass `navigator` for tests, embedded environments, or SSR-aware setup. `stop()`
removes the `devicechange` listener.

```ts
const devices = useDevicesList({ navigator: window.navigator });

devices.stop();
```

`ensurePermissions()` first checks the Permissions API for `camera` and
`microphone` when available. If permission is still promptable, it opens a
temporary `getUserMedia()` stream and stops all tracks after refreshing the
device list.
