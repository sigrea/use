---
category: Elements
---

# useActiveElement

Reactive active element for a document or shadow root.

## Usage

```ts
import { useActiveElement } from "@sigrea/use";

const { activeElement } = useActiveElement();

console.log(activeElement.value);
```

By default, shadow DOM is traversed to return the deeply focused element.

```ts
const { activeElement } = useActiveElement({ deep: false });
```

Set `triggerOnRemoval` to update when the active element is removed from the
document.

```ts
const { activeElement, stop } = useActiveElement({
	triggerOnRemoval: true,
});

stop();
```
