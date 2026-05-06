---
category: Browser
---

# useSpeechSynthesis

Reactive controls for the browser `SpeechSynthesis` API.

## Usage

```ts
import { useSpeechSynthesis } from "@sigrea/use";

const speech = useSpeechSynthesis("Hello", {
	lang: "en-US",
});

button.addEventListener("click", () => {
	speech.speak();
});
```

`speak()` creates a fresh `SpeechSynthesisUtterance` before passing it to the
browser. This keeps `text`, `lang`, `voice`, `pitch`, `rate`, and `volume`
changes out of an utterance that the browser already owns.

## Controls

```ts
speech.pause();
speech.resume();
speech.cancel();
speech.stop();
speech.toggle();
```

`stop()` is an alias of `cancel()`. The browser API cancels the whole
`speechSynthesis` queue, not only the utterance created by this composable.

`status` is `"init"`, `"play"`, `"pause"`, or `"end"`. `isPlaying` is true
while the active utterance is playing. `error` stores the latest browser error
event or thrown error.

## Voices

`voices` is populated from `speechSynthesis.getVoices()` and updated when the
browser fires `voiceschanged`.

```ts
const speech = useSpeechSynthesis("こんにちは", {
	voice: () => speech.voices.value.find((voice) => voice.lang === "ja-JP"),
});
```

Some browsers load voices asynchronously, so `voices` can be empty at first.

## Support

`isSupported` reports true only when the configured window exposes both
`speechSynthesis` and the `SpeechSynthesisUtterance` constructor. `window:
undefined` uses the default browser window when available. `window: null` never
falls back to a global value, so server-side usage keeps `isSupported` false and
controls are safe to call.

The Web Speech API has limited browser support.
