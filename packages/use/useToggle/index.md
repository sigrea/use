---
category: Utilities
---

# useToggle

A boolean switcher with utility functions.

## Usage

```ts
import { useToggle } from "@sigrea/use";

const { value, toggle } = useToggle();

toggle();
toggle(true);
```

## Custom Values

```ts
import { useToggle } from "@sigrea/use";

const { value, toggle } = useToggle("on", {
	truthyValue: "on",
	falsyValue: "off",
});

toggle(); // "off"
toggle(); // "on"
```

Without `truthyValue` and `falsyValue`, `useToggle()` is boolean-only. Custom
values require the options object.
