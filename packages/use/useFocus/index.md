---
category: Elements
---

# useFocus

Track and set focus state for an element.

## Usage

```ts
import { useFocus } from "@sigrea/use";

const input = document.querySelector("input");
const { focused, focus, blur } = useFocus(input);

console.log(focused.value);

focus();
blur();
```

## Writable Focus State

```ts
import { useFocus } from "@sigrea/use";

const { focused } = useFocus(input, {
	initialValue: true,
	preventScroll: true,
});

focused.value = true;
focused.value = false;
```

Set `focusVisible: true` to only mark the element focused when the focus event
matches `:focus-visible`. Programmatic `focus()` still passes only
`preventScroll` to the element.
