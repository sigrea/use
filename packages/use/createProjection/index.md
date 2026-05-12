# createProjection

Create a numeric projection helper from one domain to another.

## Usage

```ts
import { signal } from "@sigrea/core";
import { createProjection } from "@sigrea/use";

const useProjection = createProjection([0, 10], [0, 100]);
const input = signal(0);
const output = useProjection(input);

console.log(output.value); // 0

input.value = 5;
console.log(output.value); // 50
```

`fromDomain`, `toDomain`, and the returned helper input can be plain values,
signals, computed values, or getter functions. Pass a custom projector when the
numeric mapping needs different behavior, such as clamping.

Tuple entries are not resolved individually. When a domain endpoint is reactive,
wrap the tuple in a getter or computed value instead of placing signals inside
the tuple.
