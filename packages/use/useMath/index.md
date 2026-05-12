# useMath

Reactive `Math` methods.

## Usage

```ts
import { signal } from "@sigrea/core";
import { useMath } from "@sigrea/use";

const base = signal(2);
const exponent = signal(3);
const result = useMath("pow", base, exponent);

console.log(result.value); // 8

base.value = 3;
console.log(result.value); // 27
```

Only function keys from `Math` are accepted.
