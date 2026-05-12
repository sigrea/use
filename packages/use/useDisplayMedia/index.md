# useDisplayMedia

Reactive `MediaDevices.getDisplayMedia()` controls for screen, window, or tab
capture.

## Usage

```ts
import { useDisplayMedia } from "@sigrea/use";

const display = useDisplayMedia();

button.addEventListener("click", async () => {
	const stream = await display.start();

	if (stream !== undefined) {
		video.srcObject = stream;
	}
});
```

`getDisplayMedia()` must be started from a user action in many browsers. It
prompts the user every time and can reject if the page is not focused, the user
cancels, or the selected source cannot be captured.

## Constraints

Pass `constraints` to request display media options. The default requests video
capture.

```ts
const display = useDisplayMedia({
	constraints: {
		audio: true,
		video: { displaySurface: "browser" },
	},
});
```

Browser support for audio and newer display hints varies. Invalid combinations
are reported by the browser through `getDisplayMedia()`.

## Reactive Start

Use `enabled` when capture should follow a signal. Because browsers require user
activation, changing the signal outside a user action can leave `error` set and
`stream` empty.

```ts
import { signal } from "@sigrea/core";

const enabled = signal(false);
const display = useDisplayMedia({ enabled });

button.addEventListener("click", () => {
	enabled.value = true;
});
```

## State

| State | Description |
| --- | --- |
| `stream` | Current display capture stream. |
| `isSupported` | Whether the current navigator exposes `mediaDevices.getDisplayMedia()`. |
| `isStarting` | Whether a capture request is pending. |
| `isStreaming` | Whether a stream is currently active. |
| `error` | Last capture error, or `null` after a successful start. |

`stop()` stops all tracks on the current stream and clears the state. When the
user stops sharing from browser UI, the track `ended` event clears the current
stream as well.

## Custom Navigator

Pass `navigator` for tests, embedded environments, or SSR-aware setup.

```ts
const display = useDisplayMedia({ navigator: window.navigator });

display.stop();
```
