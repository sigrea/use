---
category: Browser
---

# useMediaControls

Reactive media controls for audio and video elements.

## Usage

```ts
import { useMediaControls } from "@sigrea/use";

const video = document.querySelector("video");
const controls = useMediaControls(video, {
	src: "video.mp4",
});

controls.volume.value = 0.5;
controls.currentTime.value = 60;
controls.playing.value = true;
```

`currentTime`, `playing`, `rate`, `volume`, and `muted` are writable computed
values. Media-derived state such as `duration`, `waiting`, `buffered`, and
`ended` is exposed as readonly signals.

## Sources

```ts
useMediaControls(video, {
	src: [
		{ src: "video.webm", type: "video/webm" },
		{ src: "video.mp4", type: "video/mp4" },
	],
});
```

Source elements are created through the injected document and the media element
is loaded after sources are added.

## Text Tracks

```ts
const controls = useMediaControls(video, {
	tracks: [
		{
			default: true,
			kind: "subtitles",
			label: "English",
			src: "./subtitles.vtt",
			srcLang: "en",
		},
	],
});

controls.enableTrack(0);
controls.disableTrack();
```

`selectedTrack` is `-1` when no text track is showing.

## Target Injection

```ts
const controls = useMediaControls(null, {
	document: null,
});
```

Passing `document: null` disables source and track element creation for SSR and
tests.
