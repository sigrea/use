---
category: Sensors
---

# onElementRemoval

Call a handler when an element, or an ancestor containing it, is removed from
the DOM.

## Usage

```ts
import { onElementRemoval } from "@sigrea/use";

const target = document.querySelector("#panel");

const stop = onElementRemoval(target, (mutationRecords) => {
	console.log("removed", mutationRecords);
});

stop();
```

## Reactive Target

```ts
import { signal } from "@sigrea/core";
import { onElementRemoval } from "@sigrea/use";

const target = signal<Element | null>(document.querySelector("#panel"));

onElementRemoval(target, closePanel);

target.value = document.querySelector("#next-panel");
```

The observer follows `MaybeTarget<Element>` values, including signals and
getters. When the target changes, the previous observer is stopped before the
new one starts.

## Return Value

`onElementRemoval` returns a stop function. Calling it disconnects the
`MutationObserver` and prevents later removals from calling the handler.
