---
category: Reactivity
---

# extendSignal

Add extra attributes to a Sigrea signal.

## Usage

```ts
import { signal } from "@sigrea/core";
import { extendSignal } from "@sigrea/use";

const message = signal("content");
const extended = extendSignal(message, { source: "extra data" });

extended.value; // content
extended.source; // extra data
```

Signal-like properties are unwrapped by default.

```ts
const message = signal("content");
const extra = signal("extra");
const extended = extendSignal(message, { extra });

extended.extra; // extra

extended.extra = "new data";
extra.value; // new data
```

Use `unwrap: false` to keep the original signal object on the added property.

```ts
const extended = extendSignal(message, { extra }, { unwrap: false });

extended.extra.value; // extra
```

`value` and `peek` are reserved by Sigrea signals and are not replaced by
extension properties.
