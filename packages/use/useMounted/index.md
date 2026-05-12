# useMounted

Readonly signal for the current Sigrea molecule mount state.

```ts
import { useMounted } from "@sigrea/use";

const mounted = useMounted();

mounted.value; // false until the molecule is mounted
```

When called inside a molecule setup, the signal becomes `true` on mount and
returns to `false` on unmount. When called outside a molecule setup, it stays
`false`.
