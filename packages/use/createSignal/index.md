---
category: Reactivity
---

# createSignal

Returns a shallow or deep value holder depending on the `deep` param.

## Usage

```ts
import { createSignal } from "@sigrea/use";

const initialData = { nested: { count: 0 } };

const shallowData = createSignal(initialData);
const deepData = createSignal(initialData, true);

shallowData.value.nested.count += 1;
deepData.value.nested.count += 1;
```

The shallow form returns a `Signal<T>`. Replacing `.value` is reactive, but
nested writes are not tracked.

```ts
const shallowData = createSignal({ nested: { count: 0 } });

shallowData.value = { nested: { count: 1 } };
```

The deep form still returns a signal, but its inner value is tracked deeply.

```ts
const deepData = createSignal({ nested: { count: 0 } }, true);

deepData.value.nested.count += 1;
```
