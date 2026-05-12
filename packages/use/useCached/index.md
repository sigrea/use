# useCached

Cache a reactive value with a custom comparator. The comparator receives the new
source value first and the current cached value second.

When the comparator returns `true`, the cached value is kept. When it returns
`false`, the cache is updated to the new source value. The returned cache is a
readonly signal.

## Usage

```ts
import { signal } from "@sigrea/core";
import { useCached } from "@sigrea/use";

const source = signal({ value: 42, extra: 0 });
const cached = useCached(
	source,
	(newSourceValue, cachedValue) => newSourceValue.value === cachedValue.value,
);

source.value = {
	value: 42,
	extra: 1,
};

cached.value; // { value: 42, extra: 0 }

source.value = {
	value: 43,
	extra: 1,
};

cached.value; // { value: 43, extra: 1 }
```

## Watch Options

`useCached` accepts a Sigrea watch source: signal, readonly signal, computed
value, getter, or deep signal. Raw values are not accepted because there is
nothing reactive to watch.

It also accepts watch options such as `deep` and `flush`. By default it uses
synchronous flushing so the cached signal updates immediately after the source
changes.

`useCached` does not clone object values. It is intended for source replacements;
mutating the same object can also mutate the cached object reference.
