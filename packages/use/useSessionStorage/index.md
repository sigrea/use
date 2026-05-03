---
category: State
---

# useSessionStorage

Reactive `sessionStorage` signal.

## Usage

```ts
import { useSessionStorage } from "@sigrea/use";

const draft = useSessionStorage("draft", "");

draft.value = "working copy";
draft.remove();
```

Pass `window` when the storage target needs to be replaced.
