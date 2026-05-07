# createGenericProjection

Create a projection helper with a custom projector function.

## Usage

```ts
import { signal } from "@sigrea/core";
import { createGenericProjection } from "@sigrea/use";

const from = signal<readonly [number, number]>([0, 10]);
const to = signal<readonly ["low", "high"]>(["low", "high"]);

const useProjection = createGenericProjection(
	from,
	to,
	(input, fromDomain, toDomain) => {
		const midpoint = (fromDomain[0] + fromDomain[1]) / 2;
		return input <= midpoint ? toDomain[0] : toDomain[1];
	},
);

const input = signal(3);
const output = useProjection(input);

console.log(output.value); // "low"
```

`fromDomain`, `toDomain`, and the returned helper input can be plain values,
signals, computed values, or getter functions. The returned value is a readonly
computed signal.

Tuple entries are not resolved individually. When a domain endpoint is reactive,
wrap the tuple in a getter or computed value instead of placing signals inside
the tuple.
