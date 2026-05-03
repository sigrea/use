---
category: Sensors
---

# onClickOutside

Listen for clicks outside of an element.

## Usage

```ts
import { onClickOutside } from "@sigrea/use";

const target = document.querySelector("#menu");

const stop = onClickOutside(target, (event) => {
	console.log(event);
});
```

## Ignore Elements

```ts
import { signal } from "@sigrea/core";
import { onClickOutside } from "@sigrea/use";

const ignored = signal(document.querySelector("#button"));

onClickOutside(target, close, {
	ignore: [ignored, ".ignore"],
});
```

## Controls

```ts
import { onClickOutside } from "@sigrea/use";

const { stop, cancel, trigger } = onClickOutside(target, close, {
	controls: true,
});

cancel();
document.addEventListener("click", (event) => {
	trigger(event);
});
stop();
```

`cancel()` prevents the next click from calling the handler. Calling `trigger()`
manually calls the handler and clears that pending cancellation, so the next
real outside click can be handled normally.

The click listener uses capture phase by default. Set `capture: false` when the
listener should run in bubble phase. Set `detectIframe: true` to call the
handler when focus moves to an iframe.
