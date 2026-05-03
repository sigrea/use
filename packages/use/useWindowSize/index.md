---
category: Elements
---

# useWindowSize

Reactive window size.

## Usage

```ts
import { useWindowSize } from "@sigrea/use";

const { width, height } = useWindowSize();

console.log(width.value, height.value);
```

## Options

```ts
import { useWindowSize } from "@sigrea/use";

const { width, height } = useWindowSize({
	type: "visual",
});
```

`type` supports `"inner"`, `"outer"`, and `"visual"`. When `visualViewport` is
available, the `"visual"` type reports its size multiplied by its scale.
