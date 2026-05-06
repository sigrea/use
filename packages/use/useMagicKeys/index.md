---
category: Sensors
---

# useMagicKeys

Tracks pressed keyboard keys and key combinations.

## Usage

```ts
import { useMagicKeys } from "@sigrea/use";

const keys = useMagicKeys();

keys.shift.value; // false
keys.space.value; // false
```

Key names are case-insensitive. The default return value for each tracked key is
a readonly signal.

## Combinations

```ts
const shortcut = keys.ctrl_shift_period;

shortcut.value; // true when Control, Shift, and Period are pressed
```

Combination names can use `+`, `_`, or `-` between keys.

## Current Keys

```ts
const current = keys.current;

current.value.has("a");
```

`current` is a readonly signal containing the currently pressed key names.

## Reactive Mode

```ts
const keys = useMagicKeys({ reactive: true });

keys.shift; // boolean
keys.current.has("shift"); // boolean
```

Reactive mode returns booleans from the proxy. Reading a key inside a Sigrea
computed or watcher still tracks the underlying signal.

## Target Injection

```ts
const keys = useMagicKeys({
	target: document,
	window: null,
});
```

Passing `window: null` disables the browser window fallback for SSR and tests.
