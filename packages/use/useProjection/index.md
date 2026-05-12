# useProjection

Reactive numeric projection from one domain to another.

## Usage

```ts
import { signal } from "@sigrea/core";
import { useProjection } from "@sigrea/use";

const input = signal(0);
const projected = useProjection(input, [0, 10], [0, 100]);

input.value = 5;
console.log(projected.value); // 50

input.value = 10;
console.log(projected.value); // 100
```

`input`, `fromDomain`, and `toDomain` can be plain values, signals, computed
values, or getter functions. Pass a custom projector when the numeric mapping
needs different behavior, such as clamping.

Tuple entries are not resolved individually. When a domain endpoint is reactive,
wrap the tuple in a getter or computed value instead of placing signals inside
the tuple.
