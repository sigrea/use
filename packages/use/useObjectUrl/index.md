---
category: Browser
---

# useObjectUrl

Reactive object URL for `Blob`, `File`, or `MediaSource` values.

## Usage

```ts
import { useObjectUrl } from "@sigrea/use";

const file = new File(["hello"], "hello.txt", { type: "text/plain" });
const { url, stop } = useObjectUrl(file);

console.log(url.value);

stop();
```

The previous URL is revoked whenever the source object changes. `stop()` revokes
the current URL and clears the signal.

Pass `window: null` when running without browser globals. In that case no object
URL is created.
