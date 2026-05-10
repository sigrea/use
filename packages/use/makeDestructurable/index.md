---
category: Utilities
---

# makeDestructurable

Make a return value destructurable as both an object and an array.

## Usage

```ts
import { makeDestructurable } from "@sigrea/use";

const foo = { name: "foo" };
const bar = 1024;

const result = makeDestructurable({ foo, bar } as const, [foo, bar] as const);

const { foo: objectFoo, bar: objectBar } = result;
const [arrayFoo, arrayBar] = result;
```
