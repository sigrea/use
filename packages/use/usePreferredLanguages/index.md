---
category: Sensors
---

# usePreferredLanguages

Reactive `navigator.languages`.

## Usage

```ts
import { usePreferredLanguages } from "@sigrea/use";

const { isSupported, languages, stop } = usePreferredLanguages();

console.log(isSupported.value);
console.log(languages.value);

stop();
```

## Custom Navigator

```ts
import { usePreferredLanguages } from "@sigrea/use";

const state = usePreferredLanguages({
	navigator: window.navigator,
	window,
});

console.log(state.languages.value);
```

The value is refreshed on the window `languagechange` event. `window: null`
disables event listening instead of falling back to the global window.
