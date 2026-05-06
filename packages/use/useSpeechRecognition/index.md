---
category: Browser
---

# useSpeechRecognition

Reactive controls for the browser `SpeechRecognition` API.

## Usage

```ts
import { useSpeechRecognition } from "@sigrea/use";

const speech = useSpeechRecognition({
	lang: "en-US",
});

button.addEventListener("click", () => {
	speech.toggle();
});
```

`start()` should be called from a user action such as a button click. Browsers
can ask for microphone permission, require a secure context, or reject the
request when speech recognition is unavailable.

## Result

`result` stores the full transcript for the current recognition session.
`isFinal` is true when the browser has returned at least one result and every
result is final.

```ts
const speech = useSpeechRecognition({
	continuous: true,
	interimResults: true,
});

speech.start();

console.log(speech.result.value);
```

`error` stores the latest browser error event or thrown error. A later result
clears it.

## Language

`lang` accepts a reactive value. While recognition is stopped, changes are
applied to the native recognition instance.

```ts
import { signal } from "@sigrea/core";

const lang = signal("en-US");
const speech = useSpeechRecognition({ lang });

lang.value = "ja-JP";
```

## Support

`isSupported` reports whether the configured window exposes `SpeechRecognition`
or `webkitSpeechRecognition`. `window: undefined` uses the default browser
window when available. `window: null` never falls back to a global value, so
server-side usage keeps `isSupported` false and controls are safe to call.

The Web Speech API has limited browser support.
