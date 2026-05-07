---
category: Sensors
---

# useTextSelection

Reactively track the current text selection from `Window.getSelection()`.

## Usage

```ts
import { useTextSelection } from "@sigrea/use";

const selection = useTextSelection();

console.log(selection.text.value);
```

`ranges` contains the active `Range` objects, and `rects` contains each range's
bounding client rect.

## Cleanup

`stop()` removes the `selectionchange` listener.
