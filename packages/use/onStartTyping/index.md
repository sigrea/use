---
category: Sensors
---

# onStartTyping

Run a callback when the user starts typing outside editable elements.

## Usage

```ts
import { onStartTyping } from "@sigrea/use";

const input = document.querySelector("input");

const stop = onStartTyping(() => {
	input?.focus();
});

stop();
```

The callback runs for alphanumeric key presses when no editable element is
focused.

## Editable Elements

`onStartTyping` ignores key presses while an `input`, `textarea`, `select`, or
`contenteditable` element is focused.

## Document

```ts
import { onStartTyping } from "@sigrea/use";

onStartTyping(focusSearch, { document: iframe.contentDocument });
```

The `document` option accepts a document, signal, or getter. The listener follows
document changes and does nothing while the document is unavailable.
