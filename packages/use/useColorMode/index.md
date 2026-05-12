---
category: Browser
related: usePreferredDark, useStorage
---

# useColorMode

Reactive color mode with optional storage persistence.

## Usage

```ts
import { useColorMode } from "@sigrea/use";

const colorMode = useColorMode();

colorMode.mode.value = "dark";

console.log(colorMode.mode.value); // "dark"
console.log(colorMode.resolvedMode.value); // "dark"
```

`mode` keeps the selected value, including `"auto"`. `resolvedMode` is the
mode passed to the default DOM updater.

## Attribute

```ts
import { useColorMode } from "@sigrea/use";

const colorMode = useColorMode({
	attribute: "data-theme",
});

colorMode.mode.value = "auto";
```

## Custom Modes

```ts
import { useColorMode } from "@sigrea/use";

const colorMode = useColorMode<"dim">({
	modes: {
		dim: "theme-dim",
	},
});

colorMode.mode.value = "dim";
```

## Storage

```ts
import { useColorMode } from "@sigrea/use";

const colorMode = useColorMode({
	storageKey: "theme",
});

const temporaryColorMode = useColorMode({
	storageKey: null,
});
```

The default storage key is `"sigrea-color-scheme"`.

## Custom Updates

```ts
import { useColorMode } from "@sigrea/use";

const colorMode = useColorMode({
	onChanged(mode, defaultHandler) {
		document.documentElement.dataset.theme = mode;
		defaultHandler(mode);
	},
});
```

When `onChanged` is set, DOM updates are fully controlled by that callback.
Call `defaultHandler(mode)` to keep the built-in class or attribute update.

## Server Side Rendering

```ts
import { useColorMode } from "@sigrea/use";

const colorMode = useColorMode({
	window: null,
	initialValue: "dark",
});
```

Without a browser window, DOM and storage updates are skipped.
