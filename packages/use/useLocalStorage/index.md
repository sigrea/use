---
category: State
---

# useLocalStorage

Reactive `localStorage` signal.

## Usage

```ts
import { useLocalStorage } from "@sigrea/use";

const token = useLocalStorage("token", "");

token.value = "next-token";
token.remove();
```

Pass `window` when the storage target needs to be replaced.
