---
category: Browser
related: useColorMode, usePreferredDark, useStorage
---

# useDark

Reactive dark mode with optional storage persistence.

## Usage

```ts
import { useDark } from "@sigrea/use";

const isDark = useDark();

isDark.value = true;
```

`useDark` is a boolean wrapper around `useColorMode`. When the requested value
matches the current system mode, the selected color mode is stored as `"auto"`.

## Custom Values

```ts
import { useDark } from "@sigrea/use";

const isDark = useDark({
	valueDark: "theme-dark",
	valueLight: "theme-light",
});
```

`valueDark` and `valueLight` are the values applied to the configured class or
attribute.

## Custom Updates

```ts
import { useDark } from "@sigrea/use";

const isDark = useDark({
	onChanged(isDark, defaultHandler, mode) {
		document.documentElement.dataset.dark = String(isDark);
		defaultHandler(mode);
	},
});
```

When `onChanged` is set, DOM updates are controlled by that callback. Call
`defaultHandler(mode)` to keep the built-in class or attribute update.

## Server Side Rendering

```ts
import { useDark } from "@sigrea/use";

const isDark = useDark({
	window: null,
	initialValue: "dark",
});
```

Without a browser window, DOM and storage updates are skipped.
