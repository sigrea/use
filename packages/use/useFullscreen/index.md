---
category: Browser
---

# useFullscreen

Reactive controls for the Fullscreen API.

## Usage

```ts
import { useFullscreen } from "@sigrea/use";

const fullscreen = useFullscreen();

button.addEventListener("click", () => {
	void fullscreen.toggle();
});
```

When no target is passed, `document.documentElement` is used.

## Target

```ts
const video = document.querySelector("video");
const fullscreen = useFullscreen(video);

await fullscreen.enter({ navigationUI: "hide" });
await fullscreen.exit();
```

`isFullscreen` is synchronized from `fullscreenchange`, including prefixed
browser events.

## Cleanup

```ts
const fullscreen = useFullscreen(panel, {
	autoExit: true,
});

fullscreen.stop();
```

`document: null` never falls back to the global document, so server-side usage
keeps `isSupported` and `isFullscreen` false while methods remain callable.
