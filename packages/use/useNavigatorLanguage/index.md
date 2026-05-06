---
category: Sensors
---

# useNavigatorLanguage

Reactive `navigator.language`.

## Usage

```ts
import { useNavigatorLanguage } from "@sigrea/use";

const { isSupported, language, stop } = useNavigatorLanguage();

console.log(isSupported.value);
console.log(language.value);

stop();
```

## Custom Navigator

```ts
import { useNavigatorLanguage } from "@sigrea/use";

const state = useNavigatorLanguage({
	navigator: window.navigator,
	window,
});

console.log(state.language.value);
```

The value is refreshed on the window `languagechange` event. `window: null`
disables event listening instead of falling back to the global window.
