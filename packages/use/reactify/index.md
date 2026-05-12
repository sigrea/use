---
category: Reactivity
related: createResolveValueFn
---

# reactify

Convert a plain function into a function that accepts raw values, signals,
computed values, and getters as arguments, then returns a readonly computed
signal.

## Usage

```ts
import { signal } from "@sigrea/core";
import { reactify } from "@sigrea/use";

const add = reactify((left: number, right: number) => left + right);

const left = signal(1);
const sum = add(left, () => 2);

console.log(sum.value); // 3

left.value = 5;

console.log(sum.value); // 7
```

`reactify()` is the computed counterpart to `createResolveValueFn()`.
`createResolveValueFn()` calls the source function immediately and returns the
source return value. `reactify()` returns a readonly computed signal that
re-runs when the resolved arguments change.

Nested tracking is controlled by the source value. Pass a deep signal when
nested writes should update the computed result; `reactify()` does not add its
own shallow/deep option.

Function arguments are treated as getters. If the original function needs a
function value, pass it from another wrapper value instead of passing the
function directly.
