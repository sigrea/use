# usePrecision

Reactively set the precision of a number.

## Usage

```ts
import { signal } from "@sigrea/core";
import { usePrecision } from "@sigrea/use";

const value = signal(3.1415);
const result = usePrecision(value, 2);

console.log(result.value); // 3.14

const ceilResult = usePrecision(value, 2, {
	math: "ceil",
});

console.log(ceilResult.value); // 3.15
```

The rounding method can be `"round"`, `"ceil"`, or `"floor"`. It defaults to
`"round"`.
