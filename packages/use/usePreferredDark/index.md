---
category: Browser
---

# usePreferredDark

Reactive dark color scheme preference.

## Usage

```ts
import { usePreferredDark } from "@sigrea/use";

const isDark = usePreferredDark();

console.log(isDark.matches.value);
```

## Server Side Rendering

```ts
import { usePreferredDark } from "@sigrea/use";

const isDark = usePreferredDark({
	initialValue: false,
});
```

`usePreferredDark` is a wrapper around
`(prefers-color-scheme: dark)`.
