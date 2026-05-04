---
category: Reactivity
related: reactify
---

# reactifyObject

Apply `reactify()` to function properties on an object.

## Usage

```ts
import { signal } from "@sigrea/core";
import { reactifyObject } from "@sigrea/use";

const { pow } = reactifyObject(Math, { includeOwnProperties: true });
const base = signal(2);
const exponent = signal(3);
const result = pow(base, exponent);

console.log(result.value); // 8

base.value = 3;

console.log(result.value); // 27
```

Function properties become reactified functions. Non-function properties are
returned unchanged.

## Keys

```ts
import { reactifyObject } from "@sigrea/use";

const api = reactifyObject(Math, ["max", "min"] as const);
```

Pass a key list to reactify only selected properties.

## Own Properties

```ts
import { reactifyObject } from "@sigrea/use";

const api = reactifyObject(Math, { includeOwnProperties: true });
```

`includeOwnProperties` includes non-enumerable own keys returned by
`Reflect.ownKeys()`. It defaults to `true`.
