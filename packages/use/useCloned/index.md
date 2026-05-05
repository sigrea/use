# useCloned

Creates an editable cloned signal from a source value.

The returned `cloned` signal can be edited independently from the source.
`isModified` becomes `true` after the cloned value is edited, and `sync()` resets
the clone from the current source value.

## Usage

```ts
import { signal } from "@sigrea/core";
import { useCloned } from "@sigrea/use";

const source = signal({ nested: { count: 1 } });
const { cloned, isModified, sync } = useCloned(source);

cloned.value.nested.count = 2;

source.value.nested.count; // 1
isModified.value; // true

sync();

cloned.value.nested.count; // 1
isModified.value; // false
```

## Manual Sync

By default, signal, computed, and getter sources are watched and cloned again
when the source changes. Raw values are cloned once and can still be synced
manually.

```ts
const source = signal({ count: 1 });
const cloned = useCloned(source, { manual: true });

source.value = { count: 2 };

cloned.cloned.value.count; // 1

cloned.sync();

cloned.cloned.value.count; // 2
```

## Options

| Option | Default | Description |
| --- | --- | --- |
| `clone` | `structuredClone` | Synchronous clone function used by `sync()` and automatic source updates. |
| `manual` | `false` | Disable automatic syncing from reactive sources. |
| `deep` | `true` | Watch nested source changes when the source supports deep tracking. |
| `flush` | `"sync"` | Source watch flush timing. |
| `onTrack` | `undefined` | Source watch tracking hook. |
| `onTrigger` | `undefined` | Source watch trigger hook. |

## Notes

The default clone uses `structuredClone()` and falls back to JSON cloning when
`structuredClone()` is unavailable. `structuredClone()` preserves more built-in
data types than JSON cloning, but it still throws for values the structured
clone algorithm cannot copy, such as functions. If that is not suitable, pass a
custom synchronous `clone` function.

`cloneStructured(value)` is exported when you want the same default clone
behavior in a custom `clone` function.

Custom clone functions are responsible for returning an isolated value. If a
custom clone returns the original object or a shallow copy, source and cloned
mutations can still affect each other.

`stop()` stops automatic source syncing and modification tracking. `sync()` can
still be called after `stop()` to manually refresh the cloned value.
