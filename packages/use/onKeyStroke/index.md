---
category: Sensors
---

# onKeyStroke

Listen for keyboard events and run a handler when the key matches.

## Usage

```ts
import { onKeyStroke } from "@sigrea/use";

const stop = onKeyStroke("Escape", (event) => {
	event.preventDefault();
	closeDialog();
});

stop();
```

## Multiple Keys

```ts
import { onKeyStroke } from "@sigrea/use";

onKeyStroke(["ArrowUp", "w", "W"], moveUp);
```

## Predicate

```ts
import { onKeyStroke } from "@sigrea/use";

onKeyStroke(
	(event) => event.metaKey && event.key === "k",
	openCommandMenu,
);
```

## Target

```ts
import { onKeyStroke } from "@sigrea/use";

const input = document.querySelector("input");

onKeyStroke("Enter", submit, { target: input });
```

When `target` is omitted, `onKeyStroke` listens on `window`. You can pass a
signal or getter target, and the listener follows target changes.

## Dedupe

```ts
import { onKeyStroke } from "@sigrea/use";

onKeyStroke("ArrowDown", moveDown, { dedupe: true });
```

`dedupe: true` ignores repeated keyboard events while a key is held down.

## Event Aliases

```ts
import { onKeyDown, onKeyPressed, onKeyUp } from "@sigrea/use";

onKeyDown("Escape", closeDialog);
onKeyPressed("Enter", submit);
onKeyUp("Shift", clearShiftState);
```

`onKeyPressed` is provided for VueUse API compatibility. Prefer `onKeyDown` or
`onKeyUp` for new keyboard handling.
