# useArrayReduce

Reactive `Array.reduce`.

## Usage

```ts
import { signal } from "@sigrea/core";
import { useArrayReduce } from "@sigrea/use";

const first = signal(1);
const second = signal(2);
const third = signal(3);

const sum = useArrayReduce([first, second, third], (total, value) => {
	return total + value;
});

sum.value; // 6
```

## Reactive Arrays

Pass a signal, computed value, or getter when the source array itself changes.

```ts
import { signal } from "@sigrea/core";
import { useArrayReduce } from "@sigrea/use";

const list = signal([1, 2]);
const sum = useArrayReduce(list, (total, value) => total + value);

sum.value; // 3

list.value = [1, 2, 3];
sum.value; // 6
```

## Initial Value

The initial value may be raw, a signal, a computed value, or a getter.

```ts
import { signal } from "@sigrea/core";
import { useArrayReduce } from "@sigrea/use";

const initialValue = signal(10);
const sum = useArrayReduce([1, 2], (total, value) => total + value, initialValue);

sum.value; // 13

initialValue.value = 20;
sum.value; // 23
```

Reducer arguments are the resolved accumulator, resolved item, and current
index. A getter initial value is called for each recomputation so mutable
accumulators can start fresh.
