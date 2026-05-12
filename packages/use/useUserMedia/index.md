# useUserMedia

Reactive `MediaDevices.getUserMedia()` controls for camera and microphone
streams.

## Usage

```ts
import { useUserMedia } from "@sigrea/use";

const media = useUserMedia();

button.addEventListener("click", async () => {
	const stream = await media.start();

	if (stream !== undefined) {
		video.srcObject = stream;
	}
});
```

`getUserMedia()` often needs to start from a user action. The browser can reject
the request when the user cancels, the device is unavailable, or the page is not
allowed to access camera or microphone.

## Constraints

Pass `constraints` to choose audio, video, or a specific device. When
`autoSwitch` is enabled, changing `constraints` restarts the current stream.
By default, `useUserMedia()` requests both audio and video so a plain
`start()` call passes a valid `getUserMedia()` constraint object.

```ts
const media = useUserMedia({
	constraints: {
		audio: true,
		video: { facingMode: "user" },
	},
});
```

The returned `constraints`, `enabled`, and `autoSwitch` signals can be updated
after setup.

```ts
media.constraints.value = {
	audio: false,
	video: { deviceId: cameraId },
};
```

## Devices

Use `useDevicesList()` when the UI needs the available camera or microphone
list.

```ts
import { computed } from "@sigrea/core";
import { useDevicesList, useUserMedia } from "@sigrea/use";

const { videoInputs, audioInputs } = useDevicesList({
	requestPermissions: true,
});
const camera = computed(() => videoInputs.value[0]?.deviceId);
const microphone = computed(() => audioInputs.value[0]?.deviceId);

const media = useUserMedia({
	constraints: computed(() => ({
		audio: { deviceId: microphone.value },
		video: { deviceId: camera.value },
	})),
});
```

## State

| State | Description |
| --- | --- |
| `stream` | Current camera or microphone stream. |
| `isSupported` | Whether the current navigator exposes `mediaDevices.getUserMedia()`. |
| `isStarting` | Whether a stream request is pending. |
| `isStreaming` | Whether a stream is currently active. |
| `error` | Last capture error, or `null` after a successful start. |
| `enabled` | Writable signal that starts or stops the stream. |
| `autoSwitch` | Writable signal that controls constraint-change restarts. |
| `constraints` | Writable signal passed to `getUserMedia()`. |

`stop()` stops all tracks on the current stream and clears the state. When a
track ends, the current stream is cleared as well.

## Custom Navigator

Pass `navigator` for tests, embedded environments, or SSR-aware setup.

```ts
const media = useUserMedia({ navigator: window.navigator });

media.stop();
```
