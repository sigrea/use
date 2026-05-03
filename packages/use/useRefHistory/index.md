---
category: State
related: useManualRefHistory
---

# useRefHistory

Tracks writable signal changes with `watch()` and provides undo and redo
helpers.

## Usage

```ts
import { nextTick, signal } from "@sigrea/core";
import { useRefHistory } from "@sigrea/use";

const counter = signal(0);
const { history, undo, redo } = useRefHistory(counter);

counter.value += 1;
await nextTick();

console.log(history.value);
// [{ snapshot: 1, timestamp: 1601912898062 }, { snapshot: 0, timestamp: 1601912898061 }]

undo();
console.log(counter.value); // 0

redo();
console.log(counter.value); // 1
```

## Flush Timing

The default `flush` is `"pre"`, so multiple changes in the same tick are
committed together. Use `"sync"` when every source change should be committed
immediately.

```ts
const history = useRefHistory(counter, {
	flush: "sync",
});
```

When using `"sync"`, `batch()` creates one history record for several writes.

```ts
const { batch } = useRefHistory(counter, { flush: "sync" });

batch(() => {
	counter.value += 1;
	counter.value += 1;
});
```

## Pause and Resume

```ts
const { pause, resume } = useRefHistory(counter);

pause();
counter.value += 1;

resume(true); // commit the current value while resuming
```

## Objects

Use `deep: true` when nested object changes should be watched. Object values are
kept as `deepSignal()` values on the source so later nested writes can trigger
history records, including after `undo()`, `redo()`, or `reset()`. Snapshots are
cloned as plain values by default.

```ts
const state = signal({ nested: { count: 0 } });
const history = useRefHistory(state, {
	deep: true,
	flush: "sync",
});

state.value.nested.count += 1;
console.log(history.history.value[0].snapshot); // { nested: { count: 1 } }
```

`dump`, `parse`, `clone`, `capacity`, and `shouldCommit` are also supported.
