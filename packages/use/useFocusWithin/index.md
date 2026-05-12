---
category: Elements
---

# useFocusWithin

Track whether an element or one of its descendants contains focus.

## Usage

```ts
import { useFocusWithin } from "@sigrea/use";

const form = document.querySelector("form");
const { focused, stop } = useFocusWithin(form);

console.log(focused.value);

stop();
```

The state follows `focusin` and `focusout` events. Focus moves inside the same
target stay focused, matching the behavior of `:focus-within`.
