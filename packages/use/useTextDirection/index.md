---
category: Browser
---

# useTextDirection

Reactive text direction for an element's `dir` attribute.

## Usage

```ts
import { useTextDirection } from "@sigrea/use";

const direction = useTextDirection();

direction.value = "rtl";
```

By default, `useTextDirection` reads and writes the `dir` attribute on the
`html` element. Pass `selector` to target another element.

```ts
const bodyDirection = useTextDirection({
	selector: "body",
});
```

Set `observe: true` to sync external attribute changes back into the signal.

## Options

`initialValue` is returned when the target has no `dir` attribute or no document
is available. It is also used when the target has a value that does not match
`"ltr"`, `"rtl"`, or `"auto"` case-insensitively. It defaults to `"ltr"`.

```ts
const direction = useTextDirection({
	initialValue: "auto",
});
```

Pass `document: null` for SSR or non-DOM environments. The returned value stays
writable, but no DOM reads or writes are attempted.

```ts
const direction = useTextDirection({
	document: null,
	initialValue: "rtl",
});

direction.value = "auto";
```

`selector`, `observe`, and `initialValue` can also be signals or getters.

## Cleanup

`stop()` removes the internal observer and stops document retargeting.
