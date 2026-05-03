---
category: Browser
---

# useDocumentVisibility

Reactive `document.visibilityState`.

## Usage

```ts
import { useDocumentVisibility } from "@sigrea/use";

const { visibility } = useDocumentVisibility();

console.log(visibility.value);
```

## Custom Document

```ts
import { useDocumentVisibility } from "@sigrea/use";

const { visibility, stop } = useDocumentVisibility({
	document: iframe.contentDocument,
});

console.log(visibility.value);
stop();
```

When `document` is unavailable, the initial value is `"visible"`.
