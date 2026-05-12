---
category: Utilities
---

# useToString

Reactively convert a value to string.

## Usage

```ts
import { signal } from "@sigrea/core";
import { useToString } from "@sigrea/use";

const number = signal(3.14);
const stringValue = useToString(number);

stringValue.value; // "3.14"

number.value = 10;
stringValue.value; // "10"
```
