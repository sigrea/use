---
category: State
related: useRefHistory
---

# useManualRefHistory

Manually tracks a writable signal history when `commit()` is called. It also
provides undo and redo helpers.

## Usage

```ts
import { signal } from "@sigrea/core";
import { useManualRefHistory } from "@sigrea/use";

const counter = signal(0);
const { history, commit, undo, redo } = useManualRefHistory(counter);

counter.value += 1;
commit();

console.log(history.value);
// [{ snapshot: 1, timestamp: 1601912898062 }, { snapshot: 0, timestamp: 1601912898061 }]

undo();
console.log(counter.value); // 0

redo();
console.log(counter.value); // 1
```

## Objects

Use `clone: true` or a custom clone function when the source value is mutated in
place.

```ts
import { signal } from "@sigrea/core";
import { useManualRefHistory } from "@sigrea/use";

const state = signal({ count: 0 });
const { commit, undo } = useManualRefHistory(state, { clone: true });

state.value.count += 1;
commit();

undo();
console.log(state.value.count); // 0
```

## Serialization

Use `dump` and `parse` to store serialized snapshots.

```ts
const history = useManualRefHistory(state, {
	dump: JSON.stringify,
	parse: JSON.parse,
});
```

## Capacity

`capacity` limits the undo stack size.

```ts
const history = useManualRefHistory(counter, {
	capacity: 15,
});

history.clear();
```
