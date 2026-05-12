---
category: Browser
---

# useCssVar

Reactive CSS custom property controls.

## Usage

```ts
import { signal } from "@sigrea/core";
import { useCssVar } from "@sigrea/use";

const element = document.querySelector(".demo");
const color = useCssVar("--accent-color", element, {
	initialValue: "red",
});

color.value = "blue";
```

When the target is omitted, `useCssVar` uses `window.document.documentElement`.
Assigning `null` or `undefined` removes the CSS custom property from the target
element.

## Reactive Names

```ts
const property = signal("--accent-color");
const color = useCssVar(property, element);

property.value = "--surface-color";
```

Changing the target or property name removes the previous CSS custom property.
If the new target already has a value, `useCssVar` reads it into the signal;
otherwise it writes the current signal value to the new target.

## Observe

```ts
const color = useCssVar("--accent-color", element, {
	observe: true,
});
```

When `observe` is enabled, `MutationObserver` updates the signal after external
`style` or `class` attribute changes on the target element.
