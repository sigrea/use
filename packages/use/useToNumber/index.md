---
category: Utilities
---

# useToNumber

Reactively convert a string to number.

## Usage

```ts
import { signal } from "@sigrea/core";
import { useToNumber } from "@sigrea/use";

const source = signal("123.45");
const value = useToNumber(source);

value.value; // 123.45

source.value = "123";
value.value; // 123
```

## Method

```ts
const integer = useToNumber("0xFA", {
	method: "parseInt",
	radix: 16,
});

integer.value; // 250
```

When the source value is already a number, string methods return it as-is. A
custom method receives both string and number values.

## NaN

```ts
const value = useToNumber("Hi", {
	nanToZero: true,
});

value.value; // 0
```
