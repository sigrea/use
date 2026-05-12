# useArrayJoin

Reactive `Array.join`.

## Usage

```ts
import { signal } from "@sigrea/core";
import { useArrayJoin } from "@sigrea/use";

const first = signal("foo");
const second = signal(0);
const third = signal({ prop: "val" });

const result = useArrayJoin([first, second, third]);

result.value; // "foo,0,[object Object]"

first.value = "bar";
result.value; // "bar,0,[object Object]"
```

## Reactive Arrays

Pass a signal, computed value, or getter when the source array itself changes.

```ts
import { signal } from "@sigrea/core";
import { useArrayJoin } from "@sigrea/use";

const list = signal(["string", 0, { prop: "val" }, false, [1], [[2]], null]);
const result = useArrayJoin(list);

result.value; // "string,0,[object Object],false,1,2,"

list.value = [null, "string", undefined];
result.value; // ",string,"
```

## Separator

The separator may also be a signal, computed value, or getter.

```ts
import { signal } from "@sigrea/core";
import { useArrayJoin } from "@sigrea/use";

const separator = signal<string | undefined>(undefined);
const result = useArrayJoin(["foo", "bar"], separator);

result.value; // "foo,bar"

separator.value = "--";
result.value; // "foo--bar"
```
